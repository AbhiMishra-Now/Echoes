"use client";
import { Bold, Italic, Underline } from "lucide-react";
import { useState } from "react";
export function EditMode({ text, onSave, onCancel }: { text: string; onSave: (value: string) => void; onCancel: () => void }) { const [value, setValue] = useState(text); return <div className="edit-message"><div className="edit-toolbar"><Bold size={16}/><Italic size={16}/><Underline size={16}/></div><textarea value={value} onChange={e => setValue(e.target.value)} autoFocus /><div><button className="small-gold" onClick={() => onSave(value)}>Save Changes</button><button className="text-button" onClick={onCancel}>Cancel</button></div></div>; }
