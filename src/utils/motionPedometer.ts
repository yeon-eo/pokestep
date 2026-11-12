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

  // GPS tracking
  private watchId: number | null = null;
  private lastCoords: { lat: number; lng: number } | null = null;

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
    const { latitude, longitude, speed } = pos.coords;

    // If human walking speed (approx 0.5 m/s to 3.5 m/s = 1.8km/h to 12km/h)
    if (this.lastCoords) {
      const distMeters = this.calculateDistanceMeters(
        this.lastCoords.lat,
        this.lastCoords.lng,
        latitude,
        longitude
      );

      // If moved between 1.5m and 50m (filtering GPS jumps)
      if (distMeters >= 1.5 && distMeters < 50) {
        // Average human stride is ~0.75m
        const stepsFromDistance = Math.round(distMeters / 0.75);
        for (let i = 0; i < stepsFromDistance; i++) {
          this.triggerStep();
        }
      }
    }

    this.lastCoords = { lat: latitude, lng: longitude };
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
