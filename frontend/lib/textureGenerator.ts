import type { NarrativeChapter } from "../types/scroll";

const SCALE = 2;
const WIDTH = 1100;
const PADDING = 80;
const IMAGE_HEIGHT = 420;
const cache = new Map<string, HTMLCanvasElement>();

// Helper function to wrap text
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// Helper function to wrap text with first line indented
function wrapWithIndent(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  firstLineIndent: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  let isFirstLine = true;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = line ? `${line} ${word}` : word;
    const limit = isFirstLine ? maxWidth - firstLineIndent : maxWidth;

    if (ctx.measureText(candidate).width > limit) {
      if (line) {
        lines.push(line);
        line = word;
        isFirstLine = false;
      } else {
        lines.push(candidate);
        line = "";
        isFirstLine = false;
      }
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Render written chapters and loaded photographs onto a high-DPI parchment canvas. */
export function generateBiographyTexture(
  chapters: NarrativeChapter[],
  images: Record<string, HTMLImageElement> = {}
): HTMLCanvasElement {
  const key = JSON.stringify(chapters) + Object.keys(images).sort().join("|");
  const previous = cache.get(key);
  if (previous) return previous;

  // Estimate height of the scroll texture
  const estimatedHeight = Math.max(
    1400,
    chapters.reduce((sum, chapter) => {
      const textLen = chapter.text?.length ?? 0;
      const imagesCount = chapter.images?.length ?? 0;
      return sum + 480 + textLen * 2.2 + imagesCount * (IMAGE_HEIGHT + 140);
    }, 0)
  );

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = estimatedHeight * SCALE;
  canvas.style.width = `${WIDTH}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable.");

  // Enable 2x high-DPI scaling
  ctx.scale(SCALE, SCALE);

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, estimatedHeight);
  gradient.addColorStop(0, "#FDFBF7");
  gradient.addColorStop(1, "#EBE0CC");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  // Subtle Noise Overlay
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 6000; i += 1) {
    ctx.fillStyle = i % 2 ? "#6f4e37" : "#ffffff";
    ctx.fillRect(
      Math.random() * WIDTH,
      Math.random() * estimatedHeight,
      1.5,
      1.5
    );
  }
  ctx.globalAlpha = 1.0;

  let y = PADDING;

  chapters.forEach((chapter, chapterIndex) => {
    // 1. Chapter Heading (Cinzel Decorative, minimum 36px, weight 700)
    ctx.textAlign = "center";
    ctx.fillStyle = "#744c09";
    ctx.font = "700 44px 'Cinzel Decorative', serif";
    ctx.fillText(chapter.title, WIDTH / 2, y);
    y += 50;

    // Golden separator line
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(WIDTH * 0.3, y);
    ctx.lineTo(WIDTH * 0.7, y);
    ctx.stroke();

    ctx.fillStyle = "#D4AF37";
    ctx.font = "24px serif";
    ctx.fillText("✦", WIDTH / 2, y + 8);
    y += 75;

    // 2. Paragraph Drawing with Indented Drop Cap
    ctx.textAlign = "left";
    const bodyFontSize = 30; // layout px, maps to 60px physical under 2x scale
    const dropCapFontSize = bodyFontSize * 3; // 90px layout size

    const paragraphs = (
      chapter.text || "Your memories will appear here as they are woven into the scroll."
    ).split(/\n+/).filter(Boolean);

    const imagesList = chapter.images || [];
    const maxBlocks = Math.max(paragraphs.length, imagesList.length);

    for (let i = 0; i < maxBlocks; i++) {
      const para = paragraphs[i];
      const item = imagesList[i];

      if (para && item) {
        // Newspaper two-column block!
        const image = images[item.url];
        const blockWidth = WIDTH - PADDING * 2; // 1100 - 160 = 940
        const leftColWidth = blockWidth * 0.45; // 423
        const rightColWidth = blockWidth * 0.50; // 470
        const gap = blockWidth * 0.05; // 47

        let cardHeight = 220 + 54; // default card height

        if (image) {
          const cardWidth = leftColWidth;
          const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
          const imgHeight = 220; // set standard image height inside frame
          const drawWidth = Math.min(cardWidth - 20, imgHeight * ratio);
          cardHeight = imgHeight + 54; // white frame padding + caption space

          const centerX = PADDING + cardWidth / 2;
          const centerY = y + cardHeight / 2;
          const angle = ((Math.random() * 6 - 3) * Math.PI) / 180; // random tilt -3deg to +3deg

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);

          // Shadow
          ctx.shadowColor = "rgba(0,0,0,0.38)";
          ctx.shadowBlur = 9;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;

          // Polaroid border
          ctx.fillStyle = "#fffdf7";
          ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

          // Disable shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw image centered in frame
          try {
            ctx.drawImage(
              image,
              -cardWidth / 2 + 10,
              -cardHeight / 2 + 10,
              cardWidth - 20,
              imgHeight
            );
          } catch (e) {
            console.error("Failed to draw image to canvas", e);
          }

          // Caption in 'Caveat' handwritten cursive font
          ctx.fillStyle = "#3E2723";
          ctx.font = "700 24px 'Caveat', cursive";
          ctx.textAlign = "center";
          ctx.fillText(item.caption || "Keepsake", 0, cardHeight / 2 - 14);

          // Draw tape rotated -15deg at top center
          ctx.save();
          ctx.translate(0, -cardHeight / 2);
          ctx.rotate((-15 * Math.PI) / 180);
          ctx.fillStyle = "rgba(255,255,255,0.38)";
          ctx.fillRect(-30, -10, 60, 20);
          ctx.restore();

          ctx.restore();
        }

        // Draw Right Column Paragraph text next to the image
        ctx.textAlign = "left";
        ctx.fillStyle = "#2c1e16"; // Dark Ink Brown
        ctx.font = `600 ${bodyFontSize}px 'Cormorant Garamond', Georgia, serif`;

        const textStartX = PADDING + leftColWidth + gap;
        let line = "";
        let lineY = y + 28; // starting Y for first text line
        const lineSpacing = bodyFontSize * 1.5;

        // If it's paragraph index 0 in the chapter, we add the elegant drop cap!
        if (i === 0) {
          const firstLetter = para.charAt(0);
          const restText = para.slice(1);
          ctx.font = `700 ${dropCapFontSize}px 'Cinzel Decorative', serif`;
          const dropCapWidth = ctx.measureText(firstLetter).width;
          const indent = dropCapWidth + 8;

          // Gold drop cap
          ctx.fillStyle = "#D4AF37";
          ctx.fillText(firstLetter, textStartX, y + 68);

          ctx.fillStyle = "#2c1e16";
          ctx.font = `600 ${bodyFontSize}px 'Cormorant Garamond', Georgia, serif`;

          const restWords = restText.split(/\s+/);
          let isFirstLine = true;
          for (let n = 0; n < restWords.length; n++) {
            const word = restWords[n];
            const candidate = line ? `${line} ${word}` : word;
            const currentLimit = isFirstLine ? (rightColWidth - indent) : rightColWidth;

            if (ctx.measureText(candidate).width > currentLimit) {
              const currentX = isFirstLine ? textStartX + indent : textStartX;
              ctx.fillText(line, currentX, lineY);
              line = word;
              lineY += lineSpacing;
              isFirstLine = false;
            } else {
              line = candidate;
            }
          }
          const currentX = isFirstLine ? textStartX + indent : textStartX;
          ctx.fillText(line, currentX, lineY);
        } else {
          // Standard right column layout
          const words = para.split(/\s+/);
          for (let n = 0; n < words.length; n++) {
            const word = words[n];
            const candidate = line ? `${line} ${word}` : word;
            if (ctx.measureText(candidate).width > rightColWidth) {
              ctx.fillText(line, textStartX, lineY);
              line = word;
              lineY += lineSpacing;
            } else {
              line = candidate;
            }
          }
          ctx.fillText(line, textStartX, lineY);
        }

        const textBlockHeight = lineY - y;
        y += Math.max(cardHeight, textBlockHeight) + 40;

      } else if (para) {
        // Standard full-width paragraph
        ctx.textAlign = "left";
        if (i === 0) {
          // First paragraph gets the elegant drop cap full width
          const firstLetter = para.charAt(0);
          const restText = para.slice(1);

          ctx.font = `700 ${dropCapFontSize}px 'Cinzel Decorative', serif`;
          const dropCapWidth = ctx.measureText(firstLetter).width;
          const indent = dropCapWidth + 10;

          ctx.font = `600 ${bodyFontSize}px 'Cormorant Garamond', Georgia, serif`;
          const lines = wrapWithIndent(ctx, restText, WIDTH - PADDING * 2, indent);

          ctx.font = `700 ${dropCapFontSize}px 'Cinzel Decorative', serif`;
          ctx.fillStyle = "#D4AF37";
          ctx.fillText(firstLetter, PADDING, y + 48);

          ctx.font = `600 ${bodyFontSize}px 'Cormorant Garamond', Georgia, serif`;
          ctx.fillStyle = "#2c1e16";

          lines.forEach((line, lineIndex) => {
            const startX = lineIndex === 0 ? PADDING + indent : PADDING;
            ctx.fillText(line, startX, y);
            y += bodyFontSize * 1.6;
          });
          y += 18;
        } else {
          // Subsequent full-width paragraphs
          ctx.font = `600 ${bodyFontSize}px 'Cormorant Garamond', Georgia, serif`;
          ctx.fillStyle = "#2c1e16";
          const lines = wrap(ctx, para, WIDTH - PADDING * 2);
          lines.forEach((line) => {
            ctx.fillText(line, PADDING, y);
            y += bodyFontSize * 1.6;
          });
          y += 18;
        }
      } else if (item) {
        // Standalone image sticker (centered)
        const image = images[item.url];
        if (image) {
          const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
          const drawWidth = Math.min(WIDTH - PADDING * 2 - 40, IMAGE_HEIGHT * ratio);
          const cardWidth = drawWidth + 24;
          const cardHeight = IMAGE_HEIGHT + 54;

          const centerX = WIDTH / 2;
          const centerY = y + cardHeight / 2;
          const angle = ((Math.random() * 6 - 3) * Math.PI) / 180;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);

          ctx.shadowColor = "rgba(0,0,0,0.38)";
          ctx.shadowBlur = 9;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;

          ctx.fillStyle = "#fffdf7";
          ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          try {
            ctx.drawImage(
              image,
              -cardWidth / 2 + 12,
              -cardHeight / 2 + 12,
              cardWidth - 24,
              IMAGE_HEIGHT
            );
          } catch (e) {
            console.error(e);
          }

          ctx.fillStyle = "#3E2723";
          ctx.font = "700 24px 'Caveat', cursive";
          ctx.textAlign = "center";
          ctx.fillText(item.caption || "Keepsake", 0, cardHeight / 2 - 14);

          ctx.save();
          ctx.translate(0, -cardHeight / 2);
          ctx.rotate((-15 * Math.PI) / 180);
          ctx.fillStyle = "rgba(255,255,255,0.38)";
          ctx.fillRect(-35, -12, 70, 24);
          ctx.restore();

          ctx.restore();
          y += cardHeight + 40;
        }
      }
    }

    y += chapterIndex < chapters.length - 1 ? 100 : 0;
  });

  cache.set(key, canvas);
  return canvas;
}
