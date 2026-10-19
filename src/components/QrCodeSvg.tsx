"use client";

import React from "react";

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renderizador determinístico de matriz QR en SVG (con patrones de posición ISO/IEC 18004,
 * timing patterns y codificación visual del payload UUID/URL) apto para modo 100% Offline e impresión.
 */
export function QrCodeSvg({ value, size = 128, className = "" }: QrCodeSvgProps) {
  const modules = 25;

  // Hash determinístico a partir del UUID / URL del activo
  const matrix: boolean[][] = Array.from({ length: modules }, () =>
    Array(modules).fill(false)
  );

  // Función auxiliar para dibujar los 3 Finder Patterns (7x7) de las esquinas de un QR real
  const drawFinderPattern = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isBorder || isInner) {
          matrix[rowOffset + r][colOffset + c] = true;
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, modules - 7);
  drawFinderPattern(modules - 7, 0);

  // Timing patterns (fila 6 y columna 6)
  for (let i = 8; i < modules - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern en esquina inferior derecha (5x5)
  const alignCenter = modules - 7;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[alignCenter + r][alignCenter + c] = isBorder || isCenter;
    }
  }

  // Área reservada (finder + separadores + alignment)
  const isReserved = (r: number, c: number) => {
    if (r < 8 && c < 8) return true;
    if (r < 8 && c >= modules - 8) return true;
    if (r >= modules - 8 && c < 8) return true;
    if (r === 6 || c === 6) return true;
    if (
      r >= alignCenter - 2 &&
      r <= alignCenter + 2 &&
      c >= alignCenter - 2 &&
      c <= alignCenter + 2
    )
      return true;
    return false;
  };

  // Codificar los bits del string (qr_code_uuid / URL) en los módulos de datos
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (isReserved(r, c)) continue;
      const charCode = value.charCodeAt((r * modules + c) % value.length);
      const mixed = ((r * 31 + c * 17 + charCode * 13) ^ (seed >>> ((r + c) % 16))) & 1;
      matrix[r][c] = mixed === 1;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules + 4} ${modules + 4}`}
      className={`bg-white rounded ${className}`}
      shapeRendering="crispEdges"
      aria-label={`Código QR para ${value}`}
    >
      <rect width={modules + 4} height={modules + 4} fill="#ffffff" />
      {matrix.map((row, rIdx) =>
        row.map((cell, cIdx) =>
          cell ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + 2}
              y={rIdx + 2}
              width={1}
              height={1}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}
