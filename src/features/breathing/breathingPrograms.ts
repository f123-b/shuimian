export interface BreathingProgram { id: string; name: string; description: string; phases: Array<{ label: string; seconds: number; scale: "in" | "hold" | "out" }>; }

export const breathingPrograms: BreathingProgram[] = [
  { id: "relax", name: "放松呼吸", description: "让身体慢一点", phases: [{ label: "吸气", seconds: 4, scale: "in" }, { label: "呼气", seconds: 6, scale: "out" }] },
  { id: "478", name: "4 · 7 · 8", description: "适合躺下之后", phases: [{ label: "吸气", seconds: 4, scale: "in" }, { label: "屏息", seconds: 7, scale: "hold" }, { label: "呼气", seconds: 8, scale: "out" }] },
  { id: "box", name: "方形呼吸", description: "把注意力收回来", phases: [{ label: "吸气", seconds: 4, scale: "in" }, { label: "屏息", seconds: 4, scale: "hold" }, { label: "呼气", seconds: 4, scale: "out" }, { label: "停留", seconds: 4, scale: "hold" }] },
];
