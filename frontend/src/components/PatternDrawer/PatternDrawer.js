import React, { useRef, useEffect, useState, useCallback } from "react";
import "./PatternDrawer.css";

export default function PatternDrawer({ onPatternChange, initialPattern = "" }) {
  const canvasRef = useRef(null);
  const [pattern, setPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const GRID_SIZE = 3;
  const DOT_RADIUS = 25;
  const CANVAS_SIZE = 300;
  const PADDING = 50;
  const SPACING = (CANVAS_SIZE - 2 * PADDING) / (GRID_SIZE - 1);

  const getDotPosition = useCallback((num) => {
    const row = Math.floor((num - 1) / GRID_SIZE);
    const col = (num - 1) % GRID_SIZE;
    return {
      x: PADDING + col * SPACING,
      y: PADDING + row * SPACING,
    };
  }, [SPACING, PADDING]);

  const redraw = useCallback((ctx, currentPattern, mouse) => {
    // Limpiar canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dibujar líneas entre puntos
    if (currentPattern.length > 0) {
      ctx.strokeStyle = "#0b74de";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Líneas entre puntos ya seleccionados
      for (let i = 0; i < currentPattern.length - 1; i++) {
        const pos1 = getDotPosition(currentPattern[i]);
        const pos2 = getDotPosition(currentPattern[i + 1]);
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
      }

      // Línea hasta la posición actual del mouse si estamos dibujando
      if (mouse && isDrawing) {
        const lastDot = getDotPosition(currentPattern[currentPattern.length - 1]);
        ctx.beginPath();
        ctx.moveTo(lastDot.x, lastDot.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // Dibujar puntos
    for (let i = 1; i <= 9; i++) {
      const pos = getDotPosition(i);
      const isActive = currentPattern.includes(i);

      // Fondo del punto
      ctx.fillStyle = isActive ? "#0b74de" : "#e5e7eb";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Número del punto
      ctx.fillStyle = isActive ? "#ffffff" : "#666666";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i, pos.x, pos.y);
    }
  }, [getDotPosition, isDrawing]);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    redraw(ctx, pattern, null);
  }, [redraw, pattern]);

  // Redraw cuando cambia el patrón
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    redraw(ctx, pattern, mousePos);
  }, [redraw, pattern, mousePos]);

  // Cargar patrón inicial si existe
  useEffect(() => {
    if (initialPattern) {
      const nums = initialPattern.split("-").map(n => parseInt(n)).filter(n => !isNaN(n));
      setPattern(nums);
    }
  }, [initialPattern]);

  const getDotAtPosition = (x, y) => {
    for (let i = 1; i <= 9; i++) {
      const pos = getDotPosition(i);
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance <= DOT_RADIUS + 5) {
        return i;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dot = getDotAtPosition(x, y);
    if (dot && !pattern.includes(dot)) {
      setPattern([...pattern, dot]);
    }
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Agregar punto mientras se arrastra si es nuevo
    if (isDrawing) {
      const dot = getDotAtPosition(x, y);
      if (dot && !pattern.includes(dot)) {
        setPattern((prev) => [...prev, dot]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPattern([]);
    onPatternChange("");
  };

  const handleConfirm = () => {
    const patternString = pattern.join("-");
    onPatternChange(patternString);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="pattern-drawer">
      <div className="pattern-header">
        <h3>Patrón de seguridad (Opcional)</h3>
        <small>Dibuja el patrón tocando los números en orden</small>
      </div>

      <canvas
        ref={canvasRef}
        className="pattern-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />

      <div className="pattern-display">
        <div className="pattern-sequence">
          <strong>Secuencia:</strong>
          <span>{pattern.length > 0 ? pattern.join(" → ") : "Vacío"}</span>
        </div>
      </div>

      <div className="pattern-actions">
        <button type="button" className="secondary" onClick={handleClear}>
          🔄 Limpiar
        </button>
        <button type="button" onClick={handleConfirm} disabled={pattern.length < 4}>
          ✓ Confirmar (Mín. 4 puntos)
        </button>
      </div>
    </div>
  );
}
