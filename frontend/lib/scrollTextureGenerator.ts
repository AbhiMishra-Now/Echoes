import * as THREE from "three";

// Hash function to get stable random rotation from string ID
function getStableRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Return rotation between -2 and +2 degrees in radians
  const degrees = (Math.abs(hash) % 5) - 2;
  return (degrees * Math.PI) / 180;
}

// Wrap text with line limits and optional initial line indentation
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  indentWidth: number,
  indentLinesCount: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  let lineIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const isIndented = lineIndex < indentLinesCount;
    const limit = isIndented ? maxWidth - indentWidth : maxWidth;

    if (ctx.measureText(candidate).width > limit) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
        lineIndex++;
      } else {
        lines.push(candidate);
        currentLine = "";
        lineIndex++;
      }
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Draws a single page of memories onto a high-DPI canvas texture. */
export function generateScrollTexture(
  memories: any[],
  loadedImages: Record<string, HTMLImageElement>
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 3200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Draw Cream Parchment Background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#FFFEFB");
  gradient.addColorStop(0.5, "#FDFBF7");
  gradient.addColorStop(1, "#E6DEC9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Add subtle paper grain/noise
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 3 + 1.5;
    ctx.fillStyle = Math.random() > 0.5 ? "#5c4021" : "#ffffff";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  // 3. Ornate Gold Filigree Border Frame
  const borderGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  borderGradient.addColorStop(0, "#F4D03F");
  borderGradient.addColorStop(0.5, "#D4AF37");
  borderGradient.addColorStop(1, "#B8860B");

  // Double Border Lines (scaled for 2400x3200 resolution)
  ctx.lineWidth = 9;
  ctx.strokeStyle = borderGradient;
  ctx.strokeRect(75, 75, canvas.width - 150, canvas.height - 150);

  ctx.lineWidth = 3;
  ctx.strokeRect(102, 102, canvas.width - 204, canvas.height - 204);

  // Baroque Corner Filigrees
  const drawCornerFiligree = (x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 4.5;

    // Elegant loop accents
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(30, 30, 22.5, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // Little central diamond
    ctx.fillStyle = borderGradient;
    ctx.beginPath();
    ctx.moveTo(15, 15);
    ctx.lineTo(22.5, 7.5);
    ctx.lineTo(30, 15);
    ctx.lineTo(22.5, 22.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  drawCornerFiligree(102, 102, 0);
  drawCornerFiligree(canvas.width - 102, 102, Math.PI / 2);
  drawCornerFiligree(canvas.width - 102, canvas.height - 102, Math.PI);
  drawCornerFiligree(102, canvas.height - 102, -Math.PI / 2);

  // 4. Render Empty State
  if (memories.length === 0) {
    ctx.font = "italic 48px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#634731";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Your story awaits its first inscription...",
      canvas.width / 2,
      canvas.height / 2
    );
    return canvas;
  }

  // 5. Draw Page Memories
  let currentY = 240;
  const contentWidth = canvas.width - 600; // 300px padding left/right
  const paddingLeft = 300;

  for (let idx = 0; idx < memories.length; idx++) {
    const memory = memories[idx];
    const text = (memory.activeVariant === "original" ? memory.originalText : memory.polishedCaption) || "";

    // A. Render Image Polaroid if present
    if (memory.imageUrl) {
      const img = loadedImages[memory.imageUrl];
      if (img) {
        ctx.save();

        // Stable rotation or passed rotation
        const rotation = typeof memory.rotation === "number" ? (memory.rotation * Math.PI) / 180 : getStableRotation(memory.id);
        const polaroidW = 756; // 40% scale up of 540
        const polaroidH = 644; // 40% scale up of 460
        const polaroidX = canvas.width / 2;
        const polaroidY = currentY + polaroidH / 2;

        ctx.translate(polaroidX, polaroidY);
        ctx.rotate(rotation);

        // Polaroid shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 15;

        // White Polaroid card body
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-polaroidW / 2, -polaroidH / 2, polaroidW, polaroidH);

        // Reset shadow for image itself
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw image (scaled to fit top segment of polaroid, keeping 10px border on three sides)
        const innerImgW = polaroidW - 20; // 10px border on left & right
        const innerImgH = polaroidH - 120; // 10px top border, 110px bottom margin
        ctx.drawImage(
          img,
          -innerImgW / 2,
          -polaroidH / 2 + 10,
          innerImgW,
          innerImgH
        );

        // Polaroid Washi Tape (scaled 1.4x)
        ctx.fillStyle = "rgba(255, 242, 196, 0.58)";
        ctx.fillRect(-90, -polaroidH / 2 - 15, 180, 36);

        ctx.restore();

        currentY += polaroidH + 60; // 60px vertical gap
      }
    }

    // B. Render Narrative Text Block with Gold Drop Cap
    if (text) {
      ctx.save();
      const firstLetter = text.charAt(0).toUpperCase();
      const restOfText = text.slice(1);

      ctx.font = "36px 'Cormorant Garamond', Georgia, serif";
      const dropCapIndent = 90; // Horizontal space for drop cap
      const lineSpacing = 58;

      // Wrap text (the first 2 lines are indented to allow drop cap to fit floated left)
      const wrappedLines = wrapText(ctx, restOfText, contentWidth, dropCapIndent, 2);

      // Draw Gold Drop Cap (4x base size)
      const capGradient = ctx.createLinearGradient(0, currentY, 0, currentY + 90);
      capGradient.addColorStop(0, "#F4D03F");
      capGradient.addColorStop(0.5, "#D4AF37");
      capGradient.addColorStop(1, "#B8860B");
      ctx.fillStyle = capGradient;
      ctx.font = "bold 110px 'Cinzel Decorative', Georgia, serif";
      ctx.fillText(firstLetter, paddingLeft, currentY + 95);

      // Draw lines of narrative copy
      ctx.fillStyle = "#2c1e16";
      ctx.font = "36px 'Cormorant Garamond', Georgia, serif";
      ctx.textBaseline = "top";

      wrappedLines.forEach((line, lineIdx) => {
        const isIndented = lineIdx < 2;
        const xPos = paddingLeft + (isIndented ? dropCapIndent : 0);
        const yPos = currentY + lineIdx * lineSpacing;
        ctx.fillText(line, xPos, yPos);
      });

      // Calculate total text block height
      const textBlockH = Math.max(110, wrappedLines.length * lineSpacing);
      currentY += textBlockH + 60; // 60px space gap

      ctx.restore();
    }
  }

  return canvas;
}
