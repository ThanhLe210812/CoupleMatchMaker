import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangContext";

export default function AddUserForm({ onAdd, isAdding }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("male");

  const detectSex = (value) => {
    const trimmed = value.trimStart();
    if (/^Mrs?\.\s/i.test(trimmed) || /^Ms\.\s/i.test(trimmed) || /^Ms\s/i.test(trimmed) || /^Mrs\s/i.test(trimmed)) return "female";
    if (/^Mr\.\s/i.test(trimmed) || /^Mr\s/i.test(trimmed)) return "male";
    return null;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const detected = detectSex(value);
    if (detected) setSex(detected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), sex);
    setName("");
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex gap-3">
        <Input
          placeholder={t("addPlaceholder")}
          value={name}
          onChange={handleNameChange}
          className="flex-1 h-11 text-base rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
        />
        <Button
          type="submit"
          disabled={!name.trim() || isAdding}
          className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t("add")}
        </Button>
      </div>
      {/* Sex toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{t("sex")}:</span>
        <button
          type="button"
          onClick={() => setSex("male")}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
            sex === "male"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
          }`}
        >
          ♂ {t("male")}
        </button>
        <button
          type="button"
          onClick={() => setSex("female")}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
            sex === "female"
              ? "bg-pink-500 text-white border-pink-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-pink-300"
          }`}
        >
          ♀ {t("female")}
        </button>
      </div>
    </motion.form>
  );
}