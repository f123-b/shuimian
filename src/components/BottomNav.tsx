import { useKeyboard, useKeyboardInsets } from "../mobile";

export type AppTab = "tonight" | "sounds" | "profile";

const tabs: Array<{ id: AppTab; label: string; glyph: string }> = [
  { id: "tonight", label: "今晚", glyph: "◒" },
  { id: "sounds", label: "声音", glyph: "∿" },
  { id: "profile", label: "我的", glyph: "○" },
];

export function BottomNav({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  const keyboard = useKeyboard();
  const { bottomInset } = useKeyboardInsets();
  return (
    <nav className="v17-bottom-nav" aria-label="主导航" style={{ bottom: 10 + bottomInset }}>
      {tabs.map((tab) => (
        <button className="v17-nav-item" data-active={active === tab.id ? "true" : "false"} key={tab.id} onClick={() => { keyboard.hide(); onChange(tab.id); }} type="button">
          <span aria-hidden="true">{tab.glyph}</span>
          <small>{tab.label}</small>
        </button>
      ))}
    </nav>
  );
}
