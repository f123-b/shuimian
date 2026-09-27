export type SoundCategory = "rain" | "water" | "nature" | "indoor" | "scene" | "noise";
export type GeneratorKind = "white" | "pink" | "brown" | "rain" | "ocean" | "wind" | "fan" | "tone";

export interface SoundItem {
  id: string;
  name: string;
  category: SoundCategory;
  asset?: string;
  generator: GeneratorKind;
  description: string;
  glyph: string;
  license?: string;
  sourceUrl?: string;
  defaultVolume: number;
}

export const categoryLabels: Record<SoundCategory, string> = {
  rain: "雨",
  water: "水",
  nature: "自然",
  indoor: "室内",
  scene: "场景",
  noise: "噪音",
};

export const soundCatalog: SoundItem[] = [
  { id: "white", name: "纯净白噪音", category: "noise", asset: "/assets/audio/white-noise-cc0.mp3", generator: "white", description: "均匀稳定，替环境留出安静", glyph: "∿", license: "CC0", sourceUrl: "https://bigsoundbank.com/bruit-blanc-s1037.html", defaultVolume: 0.58 },
  { id: "white-soft", name: "轻柔白噪音", category: "noise", asset: "/assets/audio/white-noise-cc0.wav", generator: "white", description: "更细腻的底噪，不刺耳", glyph: "∿", license: "CC0", sourceUrl: "https://github.com/pdx-cs-sound/wavs/blob/main/noise.wav", defaultVolume: 0.54 },
  { id: "pink", name: "粉噪音", category: "noise", generator: "pink", description: "平衡柔和，适合长时间陪伴", glyph: "≈", defaultVolume: 0.52 },
  { id: "brown", name: "棕噪音", category: "noise", generator: "brown", description: "低频厚实，安定环境声", glyph: "≋", defaultVolume: 0.46 },
  { id: "rain-light", name: "小雨", category: "rain", asset: "/assets/audio/rain-real.mp3", generator: "rain", description: "细小雨点，轻轻落下", glyph: "⌁", license: "CC0", sourceUrl: "https://freesound.org/people/barkenov/sounds/640655/", defaultVolume: 0.58 },
  { id: "rain-window", name: "窗外雨", category: "rain", asset: "/assets/audio/rain-window-real.mp3", generator: "rain", description: "隔着窗听一场安静的雨", glyph: "⌁", license: "CC0", sourceUrl: "https://freesound.org/people/bastipictures/sounds/243781/", defaultVolume: 0.58 },
  { id: "rain-eave", name: "屋檐雨", category: "rain", generator: "rain", description: "连续雨幕，慢慢安定下来", glyph: "⌁", defaultVolume: 0.56 },
  { id: "rain-heavy", name: "暴雨", category: "rain", generator: "rain", description: "更密的雨声，遮住周围纷扰", glyph: "⌁", defaultVolume: 0.5 },
  { id: "rain-thunder", name: "雷雨", category: "rain", asset: "/assets/audio/rain-thunder-real.mp3", generator: "rain", description: "远处雷声与持续雨幕", glyph: "⌁", license: "CC0", sourceUrl: "https://freesound.org/people/TRP/sounds/717890/", defaultVolume: 0.48 },
  { id: "rain-tent", name: "雨打帐篷", category: "rain", generator: "rain", description: "柔软而有节奏的颗粒感", glyph: "⌁", defaultVolume: 0.54 },
  { id: "rain-car", name: "车窗雨", category: "rain", generator: "rain", description: "车窗上的雨，陪你在夜里移动", glyph: "⌁", defaultVolume: 0.5 },
  { id: "ocean", name: "海浪", category: "water", asset: "/assets/audio/ocean-real.mp3", generator: "ocean", description: "低频起伏，像潮汐一样呼吸", glyph: "∿", license: "CC0", sourceUrl: "https://freesound.org/people/SamsterBirdies/sounds/578524/", defaultVolume: 0.45 },
  { id: "stream", name: "溪流", category: "water", generator: "ocean", description: "清澈流动，不打扰思绪", glyph: "∿", defaultVolume: 0.42 },
  { id: "lake", name: "湖边", category: "water", generator: "ocean", description: "平静的水面与微风", glyph: "∿", defaultVolume: 0.4 },
  { id: "drops", name: "水滴", category: "water", generator: "rain", description: "稀疏水滴，留一点空白", glyph: "·", defaultVolume: 0.36 },
  { id: "river", name: "河流", category: "water", asset: "/assets/audio/tide-real.mp3", generator: "ocean", description: "稳定流动的宽阔水声", glyph: "∿", license: "CC0", sourceUrl: "https://freesound.org/people/Tom_Kaszuba/sounds/659002/", defaultVolume: 0.44 },
  { id: "forest", name: "森林", category: "nature", generator: "wind", description: "远离城市的深呼吸", glyph: "⌇", defaultVolume: 0.4 },
  { id: "insects", name: "夜晚虫鸣", category: "nature", generator: "wind", description: "夏夜深处的细小回声", glyph: "⌇", defaultVolume: 0.34 },
  { id: "wind", name: "夜晚微风", category: "nature", asset: "/assets/audio/wind-real.mp3", generator: "wind", description: "柔和流动，陪你进入睡眠", glyph: "⌇", license: "CC0", sourceUrl: "https://freesound.org/people/dlgebert/sounds/527281/", defaultVolume: 0.38 },
  { id: "leaves", name: "树叶", category: "nature", generator: "wind", description: "风穿过树梢的沙沙声", glyph: "⌇", defaultVolume: 0.36 },
  { id: "birds", name: "远处鸟鸣", category: "nature", generator: "tone", description: "很远的清晨，不打扰入睡", glyph: "⌁", defaultVolume: 0.22 },
  { id: "fan", name: "低语风扇", category: "indoor", generator: "fan", description: "规律平稳，适合长时间播放", glyph: "◌", defaultVolume: 0.42 },
  { id: "aircon", name: "空调", category: "indoor", generator: "fan", description: "低频而均匀的室内背景", glyph: "◌", defaultVolume: 0.4 },
  { id: "washer", name: "洗衣机", category: "indoor", generator: "fan", description: "规律轻响，带一点生活感", glyph: "◌", defaultVolume: 0.3 },
  { id: "fireplace", name: "壁炉", category: "indoor", generator: "rain", description: "温暖的细碎火焰声", glyph: "◦", defaultVolume: 0.4 },
  { id: "keyboard", name: "键盘", category: "indoor", generator: "rain", description: "稀疏而克制的敲击声", glyph: "·", defaultVolume: 0.22 },
  { id: "night-train", name: "夜班列车", category: "scene", generator: "brown", description: "车轮规律地驶过夜色", glyph: "—", defaultVolume: 0.38 },
  { id: "airplane", name: "深夜飞机", category: "scene", generator: "brown", description: "机舱低鸣，适合放空", glyph: "—", defaultVolume: 0.36 },
  { id: "cafe", name: "安静咖啡馆", category: "scene", generator: "pink", description: "有人在远处生活，而你可以休息", glyph: "·", defaultVolume: 0.28 },
  { id: "library", name: "图书馆", category: "scene", generator: "pink", description: "翻页与远处空调的低声陪伴", glyph: "·", defaultVolume: 0.25 },
  { id: "city-night", name: "深夜城市", category: "scene", generator: "brown", description: "城市睡着后留下的低频呼吸", glyph: "—", defaultVolume: 0.3 },
  { id: "car-night-rain", name: "汽车雨夜", category: "scene", generator: "rain", description: "雨刷与车窗外的夜色", glyph: "⌁", defaultVolume: 0.4 },
];

export const soundCategories = Object.keys(categoryLabels) as SoundCategory[];

export function getSound(soundId: string) {
  return soundCatalog.find((sound) => sound.id === soundId) ?? soundCatalog[0];
}

export function searchSounds(query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return soundCatalog;
  return soundCatalog.filter((sound) => `${sound.name} ${sound.description}`.toLocaleLowerCase().includes(normalized));
}
