import React from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};
loader.config({ monaco });
export default function CodeEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  theme = "vs",
}) {
  return (
    <Editor
      height="420px"
      language={language}
      theme={theme}
      value={value || ""}
      onChange={(v) => onChange?.(v || "")}
      loading={<div className="loading">Đang mở trình soạn thảo…</div>}
      options={{
        fontSize: 14,
        fontFamily: "Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 20 },
        lineNumbersMinChars: 3,
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 4,
        readOnly,
        accessibilitySupport: "on",
      }}
    />
  );
}
