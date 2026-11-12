/**
 * Real Walking Pedometer using DeviceMotion accelerometer & Geolocation distance tracking
 */

export interface PedometerStatus {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isActive: boolean;
  lastMagnitude: number;
  motionIntensity: number; // 0 to 100 for live visual gauge
}

export class MotionPedometer {
  private onStepCallback: () => void;
  private isListening: boolean = false;
  private lastStepTime: number = 0;
  private lastMagnitude: number = 9.8;
  private peakThreshold: number = 11.4; // Threshold above gravity for step detection
  private valleyThreshold: number = 8.5;
  private isWaitingForValley: boolean = false;
  private minStepIntervalMs: number = 330; // Max ~3 steps per second
  private motionIntensity: number = 0;

  // GPS tracking (fallback only: used when the motion sensor is not delivering data)
  private watchId: number | null = null;
  private lastCoords: { lat: number; lng: number; time: number } | null = null;
  private lastMotionEventTime: number = 0;
  private static readonly MOTION_ACTIVE_WINDOW_MS = 5000; // motion sensor counts as "alive" for 5s after its last reading
  private static readonly GPS_MAX_ACCURACY_M = 20; // ignore fixes less precise than this
  private static readonly GPS_MIN_MOVE_M = 5; // ignore movement smaller than this (GPS drift)
  private static readonly GPS_MIN_SPEED_MS = 0.5; // slower than this = standing still / drift
  private static readonly GPS_MAX_SPEED_MS = 3.5; // faster than this = vehicle, not walking

  constructor(onStep: () => void) {
    this.onStepCallback = onStep;
  }

  public setOnStepCallback(onStep: () => void) {
    this.onStepCallback = onStep;
  }

  public async requestPermission(): Promise<boolean> {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === 'granted';
      } catch (err) {
        console.warn('DeviceMotion permission error:', err);
        return false;
      }
    }
    return true; // Already allowed or non-iOS
  }

  public start(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isListening) return true;

    // 1. Accelerometer motion listener
    window.addEventListener('devicemotion', this.handleMotion, { passive: true });

    // 2. Geolocation distance tracking for outdoor walks
    if ('geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          this.handleGeoLocation,
          (err) => console.warn('Geolocation warning:', err),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      } catch {}
    }

    this.isListening = true;
    return true;
  }

  public stop(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('devicemotion', this.handleMotion);

    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isListening = false;
    this.motionIntensity = 0;
  }

  public getMotionIntensity(): number {
    return this.motionIntensity;
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    this.lastMotionEventTime = Date.now();

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    // Calculate 3D magnitude of acceleration
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.lastMagnitude = magnitude;

    // Calculate motion intensity (0 - 100)
    const deviation = Math.abs(magnitude - 9.8);
    this.motionIntensity = Math.min(100, Math.round(deviation * 18));

    const now = Date.now();

    // Peak-valley step detection algorithm
    if (!this.isWaitingForValley && magnitude > this.peakThreshold) {
      if (now - this.lastStepTime > this.minStepIntervalMs) {
        this.isWaitingForValley = true;
      }
    } else if (this.isWaitingForValley && magnitude < this.valleyThreshold) {
      this.isWaitingForValley = false;
      this.lastStepTime = now;
      this.triggerStep();
    }
  };

  private handleGeoLocation = (pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords;
    const now = pos.timestamp || Date.now();

    // The accelerometer already counts real steps while it is delivering data.
    // Counting GPS distance too would count the same walk twice, so GPS only
    // fills in when the motion sensor is unavailable.
    const motionSensorActive =
      Date.now() - this.lastMotionEventTime < MotionPedometer.MOTION_ACTIVE_WINDOW_MS;
    if (motionSensorActive) {
      this.lastCoords = null;
      return;
    }

    // Imprecise fixes (common indoors) jump around by tens of meters; skip them.
    if (accuracy > MotionPedometer.GPS_MAX_ACCURACY_M) return;

    if (!this.lastCoords) {
      this.lastCoords = { lat: latitude, lng: longitude, time: now };
      return;
    }

    const distMeters = this.calculateDistanceMeters(
      this.lastCoords.lat,
      this.lastCoords.lng,
      latitude,
      longitude
    );

    // Not far enough from the anchor yet: could be drift, keep accumulating.
    if (distMeters < Math.max(MotionPedometer.GPS_MIN_MOVE_M, accuracy)) return;

    const elapsedSec = Math.max(1, (now - this.lastCoords.time) / 1000);
    const speed = distMeters / elapsedSec;
    this.lastCoords = { lat: latitude, lng: longitude, time: now };

    // Only walking-speed movement counts (too slow = slow drift, too fast = vehicle).
    if (speed < MotionPedometer.GPS_MIN_SPEED_MS || speed > MotionPedometer.GPS_MAX_SPEED_MS) return;

    // Average human stride is ~0.75m
    const stepsFromDistance = Math.round(distMeters / 0.75);
    for (let i = 0; i < stepsFromDistance; i++) {
      this.triggerStep();
    }
  };

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private triggerStep() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {}
    this.onStepCallback();
  }
}
