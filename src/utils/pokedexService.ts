import { PokemonSpecies, EvolutionStage, PokemonType } from '../types/pokemon';

// Korean Name to Pokedex No. & English Name mapping for instant search
export const KOREAN_POKEMON_MAP: Record<string, { no: number; en: string; gen: number; stages?: number[] }> = {
  // 1세대 (Gen 1)
  '이상해씨': { no: 1, en: 'bulbasaur', gen: 1, stages: [1, 2, 3] },
  '이상해풀': { no: 2, en: 'ivysaur', gen: 1, stages: [1, 2, 3] },
  '이상해꽃': { no: 3, en: 'venusaur', gen: 1, stages: [1, 2, 3] },
  '파이리': { no: 4, en: 'charmander', gen: 1, stages: [4, 5, 6] },
  '리자드': { no: 5, en: 'charmeleon', gen: 1, stages: [4, 5, 6] },
  '리자몽': { no: 6, en: 'charizard', gen: 1, stages: [4, 5, 6] },
  '꼬부기': { no: 7, en: 'squirtle', gen: 1, stages: [7, 8, 9] },
  '어니부기': { no: 8, en: 'wartortle', gen: 1, stages: [7, 8, 9] },
  '거북왕': { no: 9, en: 'blastoise', gen: 1, stages: [7, 8, 9] },
  '캐터피': { no: 10, en: 'caterpie', gen: 1, stages: [10, 11, 12] },
  '버터플': { no: 12, en: 'butterfree', gen: 1, stages: [10, 11, 12] },
  '피죤투': { no: 18, en: 'pidgeot', gen: 1, stages: [16, 17, 18] },
  '피카츄': { no: 25, en: 'pikachu', gen: 1, stages: [172, 25, 26] },
  '라이츄': { no: 26, en: 'raichu', gen: 1, stages: [172, 25, 26] },
  '식스테일': { no: 37, en: 'vulpix', gen: 1, stages: [37, 38] },
  '나인테일': { no: 38, en: 'ninetales', gen: 1, stages: [37, 38] },
  '푸린': { no: 39, en: 'jigglypuff', gen: 1, stages: [174, 39, 40] },
  '고라파덕': { no: 54, en: 'psyduck', gen: 1, stages: [54, 55] },
  '골덕': { no: 55, en: 'golduck', gen: 1, stages: [54, 55] },
  '가디': { no: 58, en: 'growlithe', gen: 1, stages: [58, 59] },
  '윈디': { no: 59, en: 'arcanine', gen: 1, stages: [58, 59] },
  '알통몬': { no: 66, en: 'machop', gen: 1, stages: [66, 67, 68] },
  '괴력몬': { no: 68, en: 'machamp', gen: 1, stages: [66, 67, 68] },
  '야도란': { no: 80, en: 'slowbro', gen: 1, stages: [79, 80] },
  '코일': { no: 81, en: 'magnemite', gen: 1, stages: [81, 82, 462] },
  '고오스': { no: 92, en: 'gastly', gen: 1, stages: [92, 93, 94] },
  '고우스트': { no: 93, en: 'haunter', gen: 1, stages: [92, 93, 94] },
  '팬텀': { no: 94, en: 'gengar', gen: 1, stages: [92, 93, 94] },
  '롱스톤': { no: 95, en: 'onix', gen: 1, stages: [95, 208] },
  '텅구리': { no: 105, en: 'marowak', gen: 1, stages: [104, 105] },
  '라프라스': { no: 131, en: 'lapras', gen: 1, stages: [131] },
  '메타몽': { no: 132, en: 'ditto', gen: 1, stages: [132] },
  '이브이': { no: 133, en: 'eevee', gen: 1, stages: [133, 134, 135, 136, 196, 197, 700] },
  '샤미드': { no: 134, en: 'vaporeon', gen: 1, stages: [133, 134] },
  '쥬피썬더': { no: 135, en: 'jolteon', gen: 1, stages: [133, 135] },
  '부스터': { no: 136, en: 'flareon', gen: 1, stages: [133, 136] },
  '잉어킹': { no: 129, en: 'magikarp', gen: 1, stages: [129, 130] },
  '갸라도스': { no: 130, en: 'gyarados', gen: 1, stages: [129, 130] },
  '잠만보': { no: 143, en: 'snorlax', gen: 1, stages: [446, 143] },
  '프리져': { no: 144, en: 'articuno', gen: 1, stages: [144] },
  '썬더': { no: 145, en: 'zapdos', gen: 1, stages: [145] },
  '파이어': { no: 146, en: 'moltres', gen: 1, stages: [146] },
  '미뇽': { no: 147, en: 'dratini', gen: 1, stages: [147, 148, 149] },
  '신뇽': { no: 148, en: 'dragonair', gen: 1, stages: [147, 148, 149] },
  '망나뇽': { no: 149, en: 'dragonite', gen: 1, stages: [147, 148, 149] },
  '뮤츠': { no: 150, en: 'mewtwo', gen: 1, stages: [150] },
  '뮤': { no: 151, en: 'mew', gen: 1, stages: [151] },

  // 2세대 (Gen 2)
  '치코리타': { no: 152, en: 'chikorita', gen: 2, stages: [152, 153, 154] },
  '베이리프': { no: 153, en: 'bayleef', gen: 2, stages: [152, 153, 154] },
  '메가니움': { no: 154, en: 'meganium', gen: 2, stages: [152, 153, 154] },
  '브케인': { no: 155, en: 'cyndaquil', gen: 2, stages: [155, 156, 157] },
  '마그케인': { no: 156, en: 'quilava', gen: 2, stages: [155, 156, 157] },
  '블레이범': { no: 157, en: 'typhlosion', gen: 2, stages: [155, 156, 157] },
  '리아코': { no: 158, en: 'totodile', gen: 2, stages: [158, 159, 160] },
  '엘리게이': { no: 159, en: 'croconaw', gen: 2, stages: [158, 159, 160] },
  '장크로다일': { no: 160, en: 'feraligatr', gen: 2, stages: [158, 159, 160] },
  '피츄': { no: 172, en: 'pichu', gen: 2, stages: [172, 25, 26] },
  '토게피': { no: 175, en: 'togepi', gen: 2, stages: [175, 176, 468] },
  '토게틱': { no: 176, en: 'togetic', gen: 2, stages: [175, 176, 468] },
  '마릴': { no: 183, en: 'marill', gen: 2, stages: [298, 183, 184] },
  '에스피': { no: 196, en: 'espeon', gen: 2, stages: [133, 196] },
  '블래키': { no: 197, en: 'umbreon', gen: 2, stages: [133, 197] },
  '핫삼': { no: 212, en: 'scizor', gen: 2, stages: [123, 212] },
  '헤라크로스': { no: 214, en: 'heracross', gen: 2, stages: [214] },
  '마기라스': { no: 248, en: 'tyranitar', gen: 2, stages: [246, 247, 248] },
  '루기아': { no: 249, en: 'lugia', gen: 2, stages: [249] },
  '칠색조': { no: 250, en: 'ho-oh', gen: 2, stages: [250] },
  '세레비': { no: 251, en: 'celebi', gen: 2, stages: [251] },

  // 3세대 (Gen 3)
  '나무지기': { no: 252, en: 'treecko', gen: 3, stages: [252, 253, 254] },
  '나무킹': { no: 254, en: 'sceptile', gen: 3, stages: [252, 253, 254] },
  '아차모': { no: 255, en: 'torchic', gen: 3, stages: [255, 256, 257] },
  '영치코': { no: 256, en: 'combusken', gen: 3, stages: [255, 256, 257] },
  '번치코': { no: 257, en: 'blaziken', gen: 3, stages: [255, 256, 257] },
  '물짱이': { no: 258, en: 'mudkip', gen: 3, stages: [258, 259, 260] },
  '늪짱이': { no: 259, en: 'marshtomp', gen: 3, stages: [258, 259, 260] },
  '대짱이': { no: 260, en: 'swampert', gen: 3, stages: [258, 259, 260] },
  '가디안': { no: 282, en: 'gardevoir', gen: 3, stages: [280, 281, 282] },
  '밀로틱': { no: 350, en: 'milotic', gen: 3, stages: [349, 350] },
  '앱솔': { no: 359, en: 'absol', gen: 3, stages: [359] },
  '보만다': { no: 373, en: 'salamence', gen: 3, stages: [371, 372, 373] },
  '메타그로스': { no: 376, en: 'metagross', gen: 3, stages: [374, 375, 376] },
  '가이오가': { no: 382, en: 'kyogre', gen: 3, stages: [382] },
  '그란돈': { no: 383, en: 'groudon', gen: 3, stages: [383] },
  '레쿠쟈': { no: 384, en: 'rayquaza', gen: 3, stages: [384] },
  '지라치': { no: 385, en: 'jirachi', gen: 3, stages: [385] },

  // 4세대 (Gen 4)
  '모부기': { no: 387, en: 'turtwig', gen: 4, stages: [387, 388, 389] },
  '수풀부기': { no: 388, en: 'grotle', gen: 4, stages: [387, 388, 389] },
  '토대부기': { no: 389, en: 'torterra', gen: 4, stages: [387, 388, 389] },
  '불꽃숭이': { no: 390, en: 'chimchar', gen: 4, stages: [390, 391, 392] },
  '파이숭이': { no: 391, en: 'monferno', gen: 4, stages: [390, 391, 392] },
  '초염몽': { no: 392, en: 'infernape', gen: 4, stages: [390, 391, 392] },
  '팽도리': { no: 393, en: 'piplup', gen: 4, stages: [393, 394, 395] },
  '팽태자': { no: 394, en: 'prinplup', gen: 4, stages: [393, 394, 395] },
  '엠페르트': { no: 395, en: 'empoleon', gen: 4, stages: [393, 394, 395] },
  '렌트라': { no: 405, en: 'luxray', gen: 4, stages: [403, 404, 405] },
  '파치리스': { no: 417, en: 'pachirisu', gen: 4, stages: [417] },
  '한카리아스': { no: 445, en: 'garchomp', gen: 4, stages: [443, 444, 445] },
  '리오르': { no: 447, en: 'riolu', gen: 4, stages: [447, 448] },
  '루카리오': { no: 448, en: 'lucario', gen: 4, stages: [447, 448] },
  '포푸니라': { no: 461, en: 'weavile', gen: 4, stages: [215, 461] },
  '토게키스': { no: 468, en: 'togekiss', gen: 4, stages: [175, 176, 468] },
  '글레이시아': { no: 471, en: 'glaceon', gen: 4, stages: [133, 471] },
  '리피아': { no: 470, en: 'leafeon', gen: 4, stages: [133, 470] },
  '디아루가': { no: 483, en: 'dialga', gen: 4, stages: [483] },
  '펄기아': { no: 484, en: 'palkia', gen: 4, stages: [484] },
  '기라티나': { no: 487, en: 'giratina', gen: 4, stages: [487] },
  '다크라이': { no: 491, en: 'darkrai', gen: 4, stages: [491] },
  '아르세우스': { no: 493, en: 'arceus', gen: 4, stages: [493] },

  // 5세대 (Gen 5)
  '주리비얀': { no: 495, en: 'snivy', gen: 5, stages: [495, 496, 497] },
  '뚜꾸리': { no: 498, en: 'tepig', gen: 5, stages: [498, 499, 500] },
  '수댕이': { no: 501, en: 'oshawott', gen: 5, stages: [501, 502, 503] },
  '쌍검자비': { no: 502, en: 'dewott', gen: 5, stages: [501, 502, 503] },
  '대검귀': { no: 503, en: 'samurott', gen: 5, stages: [501, 502, 503] },
  '에몽가': { no: 587, en: 'emolga', gen: 5, stages: [587] },
  '샹델라': { no: 609, en: 'chandelure', gen: 5, stages: [607, 608, 609] },
  '삼삼드래': { no: 635, en: 'hydreigon', gen: 5, stages: [633, 634, 635] },
  '조로아': { no: 570, en: 'zorua', gen: 5, stages: [570, 571] },
  '조로아크': { no: 571, en: 'zoroark', gen: 5, stages: [570, 571] },
  '레시라무': { no: 643, en: 'reshiram', gen: 5, stages: [643] },
  '제크로무': { no: 644, en: 'zekrom', gen: 5, stages: [644] },

  // 6세대 (Gen 6)
  '도치마론': { no: 650, en: 'chespin', gen: 6, stages: [650, 651, 652] },
  '푸호꼬': { no: 653, en: 'fennekin', gen: 6, stages: [653, 654, 655] },
  '개구마르': { no: 656, en: 'froakie', gen: 6, stages: [656, 657, 658] },
  '개굴반장': { no: 657, en: 'frogadier', gen: 6, stages: [656, 657, 658] },
  '개굴닌자': { no: 658, en: 'greninja', gen: 6, stages: [656, 657, 658] },
  '님피아': { no: 700, en: 'sylveon', gen: 6, stages: [133, 700] },
  '미끄래곤': { no: 706, en: 'goodra', gen: 6, stages: [704, 705, 706] },
  '제르네아스': { no: 716, en: 'xerneas', gen: 6, stages: [716] },
  '이벨타르': { no: 717, en: 'yveltal', gen: 6, stages: [717] },

  // 7세대 (Gen 7)
  '나몰빼미': { no: 722, en: 'rowlet', gen: 7, stages: [722, 723, 724] },
  '모크나이퍼': { no: 724, en: 'decidueye', gen: 7, stages: [722, 723, 724] },
  '냐오불': { no: 725, en: 'litten', gen: 7, stages: [725, 726, 727] },
  '어흥염': { no: 727, en: 'incineroar', gen: 7, stages: [725, 726, 727] },
  '누리공': { no: 728, en: 'popplio', gen: 7, stages: [728, 729, 730] },
  '누리레느': { no: 730, en: 'primarina', gen: 7, stages: [728, 729, 730] },
  '따라큐': { no: 778, en: 'mimikyu-disguised', gen: 7, stages: [778] },
  '카푸꼬꼬꼭': { no: 785, en: 'tapu-koko', gen: 7, stages: [785] },
  '솔가레오': { no: 791, en: 'solgaleo', gen: 7, stages: [789, 790, 791] },
  '루나아라': { no: 792, en: 'lunala', gen: 7, stages: [789, 790, 792] },

  // 8세대 (Gen 8)
  '흥나숭': { no: 810, en: 'grookey', gen: 8, stages: [810, 811, 812] },
  '염버니': { no: 813, en: 'scorbunny', gen: 8, stages: [813, 814, 815] },
  '래비풋': { no: 814, en: 'raboot', gen: 8, stages: [813, 814, 815] },
  '에이스번': { no: 815, en: 'cinderace', gen: 8, stages: [813, 814, 815] },
  '울머기': { no: 816, en: 'sobble', gen: 8, stages: [816, 817, 818] },
  '인텔리레온': { no: 818, en: 'inteleon', gen: 8, stages: [816, 817, 818] },
  '마빌크': { no: 868, en: 'milcery', gen: 8, stages: [868, 869] },
  '마빌크_마휘핑': { no: 869, en: 'alcremie', gen: 8, stages: [868, 869] },
  '드라꼰': { no: 885, en: 'dreepy', gen: 8, stages: [885, 886, 887] },
  '드래펄트': { no: 887, en: 'dragapult', gen: 8, stages: [885, 886, 887] },
  '자시안': { no: 888, en: 'zacian', gen: 8, stages: [888] },
  '자마젠타': { no: 889, en: 'zamazenta', gen: 8, stages: [889] },

  // 9세대 (Gen 9)
  '나오하': { no: 906, en: 'sprigatito', gen: 9, stages: [906, 907, 908] },
  '나로테': { no: 907, en: 'floragato', gen: 9, stages: [906, 907, 908] },
  '마스카나': { no: 908, en: 'meowscarada', gen: 9, stages: [906, 907, 908] },
  '뜨아거': { no: 909, en: 'fuecoco', gen: 9, stages: [909, 910, 911] },
  '악뜨거': { no: 910, en: 'crocalor', gen: 9, stages: [909, 910, 911] },
  '라우드본': { no: 911, en: 'skeledirge', gen: 9, stages: [909, 910, 911] },
  '꾸왁스': { no: 912, en: 'quaxly', gen: 9, stages: [912, 913, 914] },
  '아꾸왁': { no: 913, en: 'quaxwell', gen: 9, stages: [912, 913, 914] },
  '웨이니발': { no: 914, en: 'quaquaval', gen: 9, stages: [912, 913, 914] },
  '빠모': { no: 921, en: 'pawmi', gen: 9, stages: [921, 922, 923] },
  '두드리짱': { no: 959, en: 'tinkaton', gen: 9, stages: [957, 958, 959] },
  '카디나르마': { no: 936, en: 'armarouge', gen: 9, stages: [935, 936] },
  '파라블레이즈': { no: 937, en: 'ceruledge', gen: 9, stages: [935, 937] },
  '코라이돈': { no: 1007, en: 'koraidon', gen: 9, stages: [1007] },
  '미라이돈': { no: 1008, en: 'miraidon', gen: 9, stages: [1008] },
  '오거폰': { no: 1017, en: 'ogerpon', gen: 9, stages: [1017] },
  '테라파고스': { no: 1024, en: 'terapagos', gen: 9, stages: [1024] },
  '복숭악귀': { no: 1025, en: 'pecharunt', gen: 9, stages: [1025] },
};

// Cache for fetched species
const speciesCache = new Map<number | string, PokemonSpecies>();

/**
 * Searches and returns Pokemon species from local dictionary OR live PokeAPI!
 */
export async function searchOrFetchPokemon(query: string): Promise<PokemonSpecies | null> {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  // 1. Check local Korean map
  for (const [koreanName, meta] of Object.entries(KOREAN_POKEMON_MAP)) {
    if (koreanName.includes(clean) || meta.en.includes(clean) || String(meta.no) === clean) {
      return createSpeciesFromNo(meta.no, koreanName, meta.en);
    }
  }

  // 2. Check if numeric Pokedex ID (1 - 1025)
  const numericId = parseInt(clean, 10);
  if (!isNaN(numericId) && numericId >= 1 && numericId <= 1025) {
    if (speciesCache.has(numericId)) return speciesCache.get(numericId)!;
    return fetchLiveFromPokeApi(numericId);
  }

  // 3. Try fetching from PokeAPI by English name or query
  return fetchLiveFromPokeApi(clean);
}

/**
 * Creates full PokemonSpecies with default evolution stages from Pokedex No.
 */
export function createSpeciesFromNo(
  pokedexNo: number,
  koreanName: string,
  englishName: string,
  types: PokemonType[] = ['normal']
): PokemonSpecies {
  const animatedFullBody = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokedexNo}.gif`;
  const staticFullBody = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexNo}.png`;
  const dex4 = String(pokedexNo).padStart(4, '0');
  const pmdNormal = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${dex4}/Normal.png`;

  const stages: EvolutionStage[] = [
    {
      id: `pk-${pokedexNo}`,
      pokedexNo,
      name: koreanName,
      nameEn: englishName,
      stage: 1,
      types,
      sprite: staticFullBody,
      animatedSprite: animatedFullBody,
      portrait: pmdNormal,
      description: `전국도감 No.${pokedexNo} ${koreanName}! 생동감 넘치게 움직이는 전신 도트 파트너 포켓몬입니다.`,
      stepsRequired: 0,
      height: '1.0m',
      weight: '20.0kg',
      category: '포켓몬',
    },
  ];

  return {
    id: `species-${pokedexNo}`,
    basePokedexNo: pokedexNo,
    name: koreanName,
    nameEn: englishName,
    primaryType: types[0] || 'normal',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-yellow-300',
    evolutionStages: stages,
  };
}

/**
 * Live fetch for ANY of the 1,025 Pokémon from PokeAPI
 */
async function fetchLiveFromPokeApi(idOrName: number | string): Promise<PokemonSpecies | null> {
  try {
    // Fetch basic pokemon data
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pokedexNo = data.id;

    // Fetch species for Korean name
    let koreanName = data.name;
    let category = '포켓몬';
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokedexNo}`);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        const koNameObj = speciesData.names?.find((n: any) => n.language?.name === 'ko');
        if (koNameObj) koreanName = koNameObj.name;
        const koGenus = speciesData.genera?.find((g: any) => g.language?.name === 'ko');
        if (koGenus) category = koGenus.genus;
      }
    } catch {}

    const types: PokemonType[] = data.types.map((t: any) => t.type.name as PokemonType);

    const species = createSpeciesFromNo(pokedexNo, koreanName, data.name, types);
    species.evolutionStages[0].category = category;
    species.evolutionStages[0].height = `${(data.height / 10).toFixed(1)}m`;
    species.evolutionStages[0].weight = `${(data.weight / 10).toFixed(1)}kg`;

    speciesCache.set(pokedexNo, species);
    return species;
  } catch {
    return null;
  }
}
