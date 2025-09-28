"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";

export default function CodingExerciseItem({ exercise, onClose }) {
  const [title, setTitle] = useState(exercise?.title || "");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript"); // javascript | php | java
  const [starterCode, setStarterCode] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);

  // Default starter codes
  const defaultCodes = {
    javascript: `console.log("Hello, world!");
console.log("Sum of 2 + 3 =", 2 + 3);`,
    php: `<?php
echo 'Hello, PHP world!';
echo " Sum of 2 + 3 = 5";
print ' This is a test.';`,
    java: `System.out.println("Hello, Java world!");
System.out.println("Sum of 2 + 3 = " + (2 + 3));
String name = "Alice";
System.out.println("Hello, " + name + "!");`,
  };

  const defaultOutputs = {
    javascript: `Hello, world!
Sum of 2 + 3 = 5`,
    php: `Hello, PHP world!
 Sum of 2 + 3 = 5
 This is a test.`,
    java: `Hello, Java world!
Sum of 2 + 3 = 
Hello, !`,
  };

  // Initialize default code and console output
  useEffect(() => {
    setStarterCode(defaultCodes[language]);
    setConsoleOutput(defaultOutputs[language]);
    setIsSimulated(language !== "javascript");
  }, [language]);

  const handleSave = () => {
    console.log("Saved Coding Exercise:", {
      title,
      description,
      language,
      starterCode,
      expectedOutput,
    });
    onClose?.();
  };

  // ---------- Helpers for simulation ----------
  function extractStringCaptures(code, regex) {
    const matches = [];
    let m;
    while ((m = regex.exec(code)) !== null) {
      const group = m.slice(1).reverse().find(Boolean);
      if (group !== undefined) matches.push(group);
      if (regex.lastIndex === m.index) regex.lastIndex++;
    }
    return matches;
  }

  function simulatePhpOutput(code) {
    const regex = /\b(?:echo|print)\s+(['"`])([\s\S]*?)\1\s*;?/gi;
    return extractStringCaptures(code, regex);
  }

  function simulateJavaOutput(code) {
    const regex = /System\.out\.println\s*\(\s*(['"`])([\s\S]*?)\1\s*\)\s*;?/gi;
    return extractStringCaptures(code, regex);
  }

  function simulateOutput(code, lang) {
    setIsSimulated(true);
    setConsoleOutput("");
    if (!code || !code.trim()) return ["(no output)"];
    if (lang === "php") {
      const lines = simulatePhpOutput(code);
      return lines.length ? lines : ["(no printable strings found)"];
    }
    if (lang === "java") {
      const lines = simulateJavaOutput(code);
      return lines.length
        ? lines
        : ["(no System.out.println string literals found)"];
    }
    return ["(simulation not available for this language)"];
  }

  // ---------- Run code ----------
  const runCode = () => {
    setIsSimulated(false);
    setConsoleOutput("");

    if (language === "javascript") {
      const logs = [];
      const originalConsoleLog = console.log;
      try {
        console.log = (...args) => {
          logs.push(args.map((a) => String(a)).join(" "));
          originalConsoleLog(...args);
        };
        eval(starterCode);
        setConsoleOutput(
          logs.join("\n") || "Code executed (no console output)."
        );
      } catch (err) {
        setConsoleOutput(`Error: ${err.message}`);
      } finally {
        console.log = originalConsoleLog;
      }
      return;
    }

    const simulated = simulateOutput(starterCode, language);
    setConsoleOutput(simulated.join("\n"));
  };

  // ---------- Format code ----------
  const formatCode = () => {
    if (language !== "javascript") {
      setConsoleOutput("Formatting is supported only for JavaScript.");
      return;
    }
    try {
      const formatted = prettier.format(starterCode || "", {
        parser: "babel",
        plugins: [parserBabel],
        semi: true,
        singleQuote: true,
      });
      setStarterCode(formatted);
    } catch (err) {
      setConsoleOutput(`Formatting Error: ${err.message}`);
    }
  };

  return (
    <div className="border p-4 rounded bg-white shadow space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-orange-600 flex items-center gap-2">
          <span>⚠️</span>
          <span>Unpublished Coding Exercise:</span>
          <strong>{exercise?.title || "New Exercise"}</strong>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          ✕
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Exercise Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter exercise title"
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Problem Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the problem..."
          rows={4}
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Language:</label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
          }}
          className="border rounded p-1 text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="php">PHP (simulated)</option>
          <option value="java">Java (simulated)</option>
        </select>
      </div>

      {/* Editor */}
      <div className="border rounded overflow-hidden">
        <Editor
          height="300px"
          defaultLanguage="javascript"
          language={language}
          value={starterCode}
          onChange={(val) => setStarterCode(val ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={runCode}
          className="px-4 py-1 border rounded text-white bg-purple-600 hover:bg-purple-700 text-sm"
        >
          ▶️ Run {language === "javascript" ? "(JS exec)" : "(simulate)"}
        </button>
        {language === "javascript" && (
          <button
            onClick={formatCode}
            className="px-4 py-1 border rounded text-white bg-indigo-600 hover:bg-indigo-700 text-sm"
          >
            ✨ Format Code
          </button>
        )}
        <button
          onClick={() => {
            setConsoleOutput("");
            setIsSimulated(false);
          }}
          className="px-3 py-1 border rounded text-sm"
        >
          Clear
        </button>
      </div>

      {/* Console Output */}
      {consoleOutput && (
        <div>
          <div className="text-xs text-gray-500 mb-1">
            {isSimulated
              ? "Simulated output (no code executed):"
              : "Console output:"}
          </div>
          <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-auto">
            {consoleOutput}
          </pre>
        </div>
      )}

      {/* Expected Output */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Expected Output (optional)
        </label>
        <textarea
          value={expectedOutput}
          onChange={(e) => setExpectedOutput(e.target.value)}
          placeholder="Add expected output..."
          rows={2}
          className="w-full border rounded p-2 text-sm font-mono"
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-3">
        <button
          onClick={onClose}
          className="px-4 py-1 border rounded text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className={`px-4 py-1 rounded text-white ${
            title.trim()
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
