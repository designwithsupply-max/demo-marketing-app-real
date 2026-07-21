import { useEffect, useRef, useState, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  Line,
  PencilBrush,
  Text as FabricText,
  Shadow,
  Path,
  Group,
} from "fabric";
import { toast } from "sonner";
import { Undo, Trash2, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DrawingCanvasProps {
  spaceId: string;
  unit: "cm" | "in";
  /** Space type decides which predetermined layouts are offered. */
  spaceType?: "Closet" | "Kitchen" | "Garage";
  /**
   * Previously saved canvas contents (from `onDrawingComplete`'s `canvasJson`).
   * Supplied when a visitor returns to a planner they didn't finish, so the
   * walls they drew are put back on the canvas instead of starting blank.
   */
  initialCanvasJson?: any;
  /** The wall lengths that were typed in alongside `initialCanvasJson`. */
  initialWallMeasurements?: WallMeasurement[];
  onDrawingComplete: (
    dataUrl: string,
    wallMeasurements: WallMeasurement[],
    totalPerimeter: number,
    totalArea: number,
    canvasJson: any,
  ) => void;
}

interface WallMeasurement {
  label: string;
  length: string;
}

/**
 * Extra properties serialised with the canvas so a restored drawing can be
 * re-linked to its wall labels (which wall goes with which "A"/"B"/"C" text).
 */
const PERSISTED_PROPS = ["wallUid", "isWallLabel", "wallChar"];

const MAX_WALLS = 7;

/**
 * Predetermined layout templates, traced as simple lines from the reference
 * kitchen/closet layout diagrams. Each entry carries:
 *  - `path`: the wall outline drawn on the Fabric canvas (one wall per segment).
 *    The SAME path is rendered as the toolbar thumbnail (see LayoutThumb), so the
 *    button always shows the exact shape that gets placed on the drawing.
 *  - `labels`: one {char,x,y} per measurable wall, positioned near its midpoint
 *  - `name`: shown as the button's accessible title
 * Kitchen layouts are used for Kitchen spaces; the closet set is shared by
 * Closet AND Garage spaces.
 */
interface LayoutTemplate {
  id: string;
  name: string;
  path: string;
  labels: Array<{ x: number; y: number }>;
}

/**
 * Renders a layout template's wall path as an inline SVG so the toolbar button
 * looks exactly like the shape that will be drawn on the canvas. Paths use a
 * 0–100 coordinate space; the viewBox is padded so the stroke isn't clipped at
 * the edges.
 */
const LayoutThumb = ({ path }: { path: string }) => (
  <svg
    viewBox="-14 -14 128 128"
    className="w-full h-[54px]"
    fill="none"
    stroke="#2D241E"
    strokeWidth={7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

const KITCHEN_LAYOUTS: LayoutTemplate[] = [
  {
    id: "k-single",
    name: "Single Wall",
    path: "M 0,40 L 100,40",
    labels: [{ x: 0, y: -22 }],
  },
  {
    id: "k-galley",
    name: "Galley",
    path: "M 0,15 L 100,15 M 0,65 L 100,65",
    labels: [{ x: 0, y: -42 }, { x: 0, y: 22 }],
  },
  {
    // L-Shaped: just two walls (A vertical, B horizontal) meeting at a corner.
    id: "k-l",
    name: "L-Shaped",
    path: "M 0,0 L 0,100 L 100,100",
    labels: [
      { x: -58, y: 0 }, { x: 0, y: 58 },
    ],
  },
  {
    // Per request, the kitchen "U-Shaped" now matches the closet Reach-In:
    // three lines (⊓) — a back wall with two side returns.
    id: "k-u",
    name: "U-Shaped",
    path: "M 0,60 L 0,0 L 100,0 L 100,60",
    labels: [
      { x: -58, y: -20 }, { x: 0, y: -58 }, { x: 58, y: -20 },
    ],
  },
];

const CLOSET_LAYOUTS: LayoutTemplate[] = [
  {
    // Three walls — A (top), B (left) and C (a short return on the lower-right).
    // The bottom is intentionally open: B hangs straight down from the top-left
    // corner and C floats on the right, disconnected from B.
    id: "c-double",
    name: "Double-Sided",
    path: "M 100,0 L 0,0 L 0,100 M 100,100 L 100,55",
    labels: [
      { x: 0, y: -58 }, { x: -58, y: 0 }, { x: 58, y: 27 },
    ],
  },
  {
    id: "c-u",
    name: "U-Shaped",
    path: "M 30,70 L 0,70 L 0,0 L 100,0 L 100,70 L 70,70",
    labels: [
      { x: -35, y: 28 }, { x: -58, y: -15 }, { x: 0, y: -58 },
      { x: 58, y: -15 }, { x: 35, y: 28 },
    ],
  },
  {
    // L-Shaped: just two walls (A vertical, B horizontal) meeting at a corner.
    id: "c-l",
    name: "L-Shaped",
    path: "M 0,0 L 0,100 L 100,100",
    labels: [
      { x: -58, y: 0 }, { x: 0, y: 58 },
    ],
  },
  {
    // Reach-In: three walls (⊓) — a back wall with two side returns.
    id: "c-reach",
    name: "Reach-In",
    path: "M 0,60 L 0,0 L 100,0 L 100,60",
    labels: [
      { x: -58, y: -20 }, { x: 0, y: -58 }, { x: 58, y: -20 },
    ],
  },
];

// Garage offers a single predetermined layout: the Reach-In (three-wall) shape.
const GARAGE_LAYOUTS: LayoutTemplate[] = [
  {
    id: "g-reach",
    name: "Reach-In",
    path: "M 0,60 L 0,0 L 100,0 L 100,60",
    labels: [
      { x: -58, y: -20 }, { x: 0, y: -58 }, { x: 58, y: -20 },
    ],
  },
];

const getLayouts = (spaceType?: "Closet" | "Kitchen" | "Garage"): LayoutTemplate[] => {
  if (spaceType === "Kitchen") return KITCHEN_LAYOUTS;
  if (spaceType === "Garage") return GARAGE_LAYOUTS;
  return CLOSET_LAYOUTS;
};

export const DrawingCanvas = ({
  spaceId,
  unit,
  spaceType,
  initialCanvasJson,
  initialWallMeasurements,
  onDrawingComplete,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [wallMeasurements, setWallMeasurements] = useState<WallMeasurement[]>([]);
  // Per-wall validation message shown under its length input (e.g. when a letter
  // is typed). Keyed by the wall's index.
  const [measurementErrors, setMeasurementErrors] = useState<Record<number, string>>({});
  const [wallCount, setWallCount] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const gridLinesRef = useRef<any[]>([]);
  const wallLabelsRef = useRef<Array<{ shape: any; label: FabricText }>>([]);
  const isRestoringRef = useRef(false);
  const { t } = useLanguage();
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  const tRef = useRef(t);

  useEffect(() => {
    onDrawingCompleteRef.current = onDrawingComplete;
  }, [onDrawingComplete]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const fireComplete = useCallback(
    (canvas: FabricCanvas, measurements: WallMeasurement[]) => {
      const dataUrl = canvas.toDataURL();
      const perimeter = measurements.reduce((sum, w) => sum + (parseFloat(w.length) || 0), 0);
      const lengths = measurements.map((w) => parseFloat(w.length) || 0).filter((l) => l > 0);
      let area = 0;
      if (lengths.length >= 2) {
        const sorted = [...lengths].sort((a, b) => a - b);
        area = sorted[0] * sorted[sorted.length - 1];
      }
      // The vector form of the drawing, so a returning visitor gets an editable
      // canvas back rather than just the flat PNG shown in the summary. Grid
      // lines are flagged `excludeFromExport` and so are left out.
      let canvasJson: any = null;
      try {
        canvasJson = canvas.toObject(PERSISTED_PROPS);
      } catch {
        canvasJson = null;
      }
      onDrawingCompleteRef.current(dataUrl, measurements, perimeter, area, canvasJson);
    },
    [],
  );

  /** Tie a wall shape to its letter label so the pair survives serialisation. */
  const stampWall = useCallback((shape: any, text: any, char: string) => {
    const uid = crypto.randomUUID();
    shape.wallUid = uid;
    text.wallUid = uid;
    text.isWallLabel = true;
    text.wallChar = char;
  }, []);

  /** Keep a label centred on its wall as that wall is moved/scaled/rotated. */
  const trackLabel = useCallback(
    (canvas: FabricCanvas, shape: any, text: any, offsetY: number) => {
      const sync = () => {
        const b = shape.getBoundingRect();
        text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 - offsetY });
        canvas.renderAll();
      };
      shape.on("moving", sync);
      shape.on("scaling", sync);
      shape.on("rotating", sync);
    },
    [],
  );

  // Restore inputs are read once, when the canvas for a space is created. They
  // live in a ref so a parent re-render can't retrigger the (expensive) canvas
  // rebuild effect below.
  const restoreRef = useRef({ json: initialCanvasJson, walls: initialWallMeasurements });
  restoreRef.current = { json: initialCanvasJson, walls: initialWallMeasurements };

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile ? Math.min(window.innerWidth - 60, 600) : 800;
    const canvasHeight = isMobile ? 400 : 500;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      selection: true,
      isDrawingMode: true,
    });

    const brush = new PencilBrush(canvas);
    brush.color = "#2D241E";
    brush.width = 3;
    canvas.freeDrawingBrush = brush;

    const drawGrid = () => {
    const gridSize = 20;
    const gridLines: any[] = [];
    for (let i = 0; i < (canvas.width || 0) / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, canvas.height || 0], {
        stroke: "#f0e7dc",
        selectable: false,
        evented: false,
        // Grid lines are redrawn on every mount, so they must never be part of
        // the saved drawing — otherwise they'd double up on each restore.
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      gridLines.push(line);
    }
    for (let i = 0; i < (canvas.height || 0) / gridSize; i++) {
      const line = new Line([0, i * gridSize, canvas.width || 0, i * gridSize], {
        stroke: "#f0e7dc",
        selectable: false,
        evented: false,
        // Grid lines are redrawn on every mount, so they must never be part of
        // the saved drawing — otherwise they'd double up on each restore.
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      gridLines.push(line);
    }
    gridLinesRef.current = gridLines;
    };
    drawGrid();

    const handlePathCreated = (e: any) => {
      if (wallLabelsRef.current.length >= MAX_WALLS) {
        canvas.remove(e.path);
        toast.error(tRef.current("canvas.maxWalls").replace("{max}", MAX_WALLS.toString()));
        return;
      }

      const path = e.path;
      const pathData = path.path;

      if (pathData && pathData.length >= 2) {
        const firstPoint = pathData[0];
        const lastPoint = pathData[pathData.length - 1];
        const startX = firstPoint[1];
        const startY = firstPoint[2];
        const endX = lastPoint[lastPoint.length - 2];
        const endY = lastPoint[lastPoint.length - 1];
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const totalLength = Math.sqrt(dx * dx + dy * dy);

        if (totalLength > 20) {
          canvas.remove(path);
          const straightLine = new Line([startX, startY, endX, endY], {
            stroke: "#2D241E",
            strokeWidth: 3,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            cornerSize: 10,
            transparentCorners: false,
            cornerColor: "#3b82f6",
            cornerStyle: "circle",
            lockRotation: false,
          });
          canvas.add(straightLine);

          const bounds = straightLine.getBoundingRect();
          const idx = wallLabelsRef.current.length;
          const labelChar = String.fromCharCode(65 + idx);
          const text = new FabricText(labelChar, {
            left: bounds.left + bounds.width / 2,
            top: bounds.top + bounds.height / 2 - 10,
            fontSize: 20,
            fill: "#ef4444",
            fontWeight: "bold",
            selectable: false,
            evented: false,
            originX: "center",
            originY: "center",
          });
          canvas.add(text);
          stampWall(straightLine, text, labelChar);
          wallLabelsRef.current.push({ shape: straightLine, label: text });
          trackLabel(canvas, straightLine, text, 10);

          setWallMeasurements((prev) => {
            const next = [...prev, { label: labelChar, length: "" }];
            setTimeout(() => fireComplete(canvas, next), 0);
            return next;
          });
          setWallCount(wallLabelsRef.current.length);
          canvas.renderAll();
          return;
        }
      }

      path.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerSize: 10,
        transparentCorners: false,
        cornerColor: "#3b82f6",
        cornerStyle: "circle",
        lockRotation: false,
      });

      const bounds = path.getBoundingRect();
      const idx = wallLabelsRef.current.length;
      const labelChar = String.fromCharCode(65 + idx);
      const text = new FabricText(labelChar, {
        left: bounds.left + bounds.width / 2,
        top: bounds.top + bounds.height / 2,
        fontSize: 20,
        fill: "#ef4444",
        fontWeight: "bold",
        selectable: false,
        evented: false,
        originX: "center",
        originY: "center",
      });
      canvas.add(text);
      stampWall(path, text, labelChar);
      wallLabelsRef.current.push({ shape: path, label: text });
      trackLabel(canvas, path, text, 0);

      setWallMeasurements((prev) => {
        const next = [...prev, { label: labelChar, length: "" }];
        setTimeout(() => fireComplete(canvas, next), 0);
        return next;
      });
      setWallCount(wallLabelsRef.current.length);
      canvas.renderAll();
    };

    canvas.on("path:created", handlePathCreated);
    canvasRef.current.style.touchAction = "none";

    setFabricCanvas(canvas);
    setWallCount(0);
    setWallMeasurements([]);
    wallLabelsRef.current = [];
    setUndoStack([]);

    // ---- Restore a drawing this visitor made earlier -------------------------
    // Without this the canvas always came back blank on a return visit, which is
    // why previously-entered rooms and measurements appeared to be lost.
    let disposed = false;
    const { json: savedJson, walls: savedWalls } = restoreRef.current;
    if (savedJson) {
      isRestoringRef.current = true;
      canvas
        .loadFromJSON(savedJson)
        .then(() => {
          if (disposed) return;
          // loadFromJSON wipes the canvas, so the grid has to go back on.
          drawGrid();
          gridLinesRef.current.forEach((line) => canvas.sendObjectToBack(line));

          // Re-link every wall shape to its letter label.
          const restored: Array<{ shape: any; label: any }> = [];
          const objects = canvas.getObjects().filter((o) => !gridLinesRef.current.includes(o));

          objects.forEach((obj: any) => {
            if (obj instanceof Group) {
              // Predetermined layout: the labels travel inside the group.
              const inner = (obj._objects || []).filter((c: any) => c.isWallLabel);
              inner.forEach((lbl: any) => restored.push({ shape: obj, label: lbl }));
              return;
            }
            if (obj.isWallLabel) return; // handled via its shape below
            const label = objects.find((o: any) => o.isWallLabel && o.wallUid && o.wallUid === obj.wallUid);
            if (label) {
              restored.push({ shape: obj, label });
              trackLabel(canvas, obj, label, obj.type === "line" ? 10 : 0);
            }
          });

          // Keep A, B, C… in their original order so the length inputs line up
          // with the letters drawn on the canvas.
          restored.sort((a, b) => String(a.label.wallChar || "").localeCompare(String(b.label.wallChar || "")));
          wallLabelsRef.current = restored;
          setWallCount(restored.length);

          if (savedWalls && savedWalls.length > 0) {
            setWallMeasurements(savedWalls);
          } else if (restored.length > 0) {
            setWallMeasurements(
              restored.map((r, i) => ({ label: String(r.label.wallChar || String.fromCharCode(65 + i)), length: "" })),
            );
          }

          // A placed layout template is meant to be dragged, not drawn over.
          if (objects.some((o) => o instanceof Group)) canvas.isDrawingMode = false;

          canvas.renderAll();
        })
        .catch((err) => {
          console.error("Could not restore the saved drawing:", err);
        })
        .finally(() => {
          isRestoringRef.current = false;
        });
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const w = mobile ? Math.min(window.innerWidth - 60, 600) : 800;
      const h = mobile ? 400 : 500;
      canvas.setDimensions({ width: w, height: h });
      canvas.renderAll();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      canvas.off("path:created", handlePathCreated);
      canvas.dispose();
    };
  }, [spaceId, fireComplete, stampWall, trackLabel]);

  useEffect(() => {
    if (!fabricCanvas) return;
    isRestoringRef.current = true;
    isRestoringRef.current = false;
  }, [fabricCanvas]);

  const prevUnitRef = useRef(unit);
  const INCH_TO_CM = 2.54;
  useEffect(() => {
    const prevUnit = prevUnitRef.current;
    if (prevUnit === unit) return;
    setWallMeasurements((prev) => {
      const next = prev.map((w) => {
        const num = parseFloat(w.length);
        if (isNaN(num)) return w;
        const converted = prevUnit === "in" ? num * INCH_TO_CM : num / INCH_TO_CM;
        return { ...w, length: (Math.round(converted * 100) / 100).toString() };
      });
      if (fabricCanvas) setTimeout(() => fireComplete(fabricCanvas, next), 0);
      return next;
    });
    prevUnitRef.current = unit;
  }, [unit, fabricCanvas, fireComplete]);

  const addShapeTemplate = (shapeType: string) => {
    const canvas = fabricCanvas;
    if (!canvas) return;
    if (wallLabelsRef.current.length > 0) {
      toast.error(t("canvas.shapeExists"));
      return;
    }

    const centerX = (canvas.width || 0) / 2;
    const centerY = (canvas.height || 0) / 2;
    const wallShadow = new Shadow({ color: "rgba(0,0,0,0.3)", blur: 8, offsetX: 2, offsetY: 2 });

    let shapeObj: any;
    let labelSpecs: Array<{ char: string; x: number; y: number }> = [];

    const currentLabelIdx = wallLabelsRef.current.length;

    const makeLabel = (char: string, x: number, y: number) => {
      const label = new FabricText(char, {
        left: x,
        top: y,
        originX: "center",
        originY: "center",
        fill: "#ef4444",
        fontSize: 20,
        fontWeight: "bold",
        selectable: false,
        evented: false,
      });
      // Marked so a restored group can be re-linked to its wall labels.
      (label as any).isWallLabel = true;
      (label as any).wallChar = char;
      return label;
    };

    const mk = (i: number, x: number, y: number) => ({
      char: String.fromCharCode(65 + currentLabelIdx + i),
      x,
      y,
    });

    // Look up the chosen predetermined layout (kitchen vs closet/garage set).
    const template = getLayouts(spaceType).find((tpl) => tpl.id === shapeType);
    if (!template) return;

    shapeObj = new Path(template.path, {
      left: -50,
      top: -50,
      stroke: "#2D241E",
      strokeWidth: 3,
      fill: "transparent",
      shadow: wallShadow,
    });
    labelSpecs = template.labels.map((l, i) => mk(i, l.x, l.y));

    if (!shapeObj || labelSpecs.length === 0) return;

    const labelObjects = labelSpecs.map((s) => makeLabel(s.char, s.x, s.y));

    const shapeGroup = new Group([shapeObj, ...labelObjects], {
      left: centerX,
      top: centerY,
      originX: "center",
      originY: "center",
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: "#3b82f6",
      cornerStyle: "circle",
      lockRotation: false,
      subTargetCheck: false,
    });

    canvas.add(shapeGroup);
    labelObjects.forEach((lbl) => {
      wallLabelsRef.current.push({ shape: shapeGroup, label: lbl });
    });

    const newMeasurements: WallMeasurement[] = labelSpecs.map((s) => ({
      label: s.char,
      length: "",
    }));

    setWallMeasurements(newMeasurements);
    setWallCount(wallLabelsRef.current.length);
    canvas.setActiveObject(shapeGroup);
    canvas.isDrawingMode = false;
    canvas.renderAll();

    fireComplete(canvas, newMeasurements);
    toast.success(`${shapeType} ${t("canvas.templateAdded").replace("{count}", labelSpecs.length.toString())}`);
  };

  const handleUndo = () => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    const drawingObjects = canvas
      .getObjects()
      .filter(
        (obj) =>
          !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText && wallLabelsRef.current.some((w) => w.label === obj)),
      );

    if (drawingObjects.length === 0) {
      toast.error(t("canvas.nothingToUndo"));
      return;
    }

    isRestoringRef.current = true;

    const lastObj = drawingObjects[drawingObjects.length - 1];
    let removedLabels = 0;

    if (lastObj instanceof Group) {
      const matchingLabels = wallLabelsRef.current.filter((item) => item.shape === lastObj);
      removedLabels = matchingLabels.length;
      matchingLabels.forEach((item) => canvas.remove(item.label));
      wallLabelsRef.current = wallLabelsRef.current.filter((item) => item.shape !== lastObj);
    } else {
      const entry = wallLabelsRef.current.find((item) => item.shape === lastObj);
      if (entry) {
        canvas.remove(entry.label);
        wallLabelsRef.current = wallLabelsRef.current.filter((item) => item.shape !== lastObj);
        removedLabels = 1;
      }
    }

    canvas.remove(lastObj);
    setWallCount(wallLabelsRef.current.length);

    // Placing a predetermined layout turns drawing mode OFF (so the shape can be
    // moved). Once nothing is left on the canvas, turn it back ON so the user can
    // immediately draw with their finger again — or pick another layout — without
    // having to press Clear first.
    if (wallLabelsRef.current.length === 0 && !canvas.isDrawingMode) {
      canvas.isDrawingMode = true;
    }

    setWallMeasurements((prev) => {
      const next = removedLabels > 0 ? prev.slice(0, -removedLabels) : prev;
      setTimeout(() => fireComplete(canvas, next), 0);
      return next;
    });

    canvas.renderAll();
    isRestoringRef.current = false;
    toast.success(t("canvas.undoSuccess"));
  };

  const handleClear = () => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (!gridLinesRef.current.includes(obj)) {
        canvas.remove(obj);
      }
    });

    setWallCount(0);
    setWallMeasurements([]);
    setMeasurementErrors({});
    wallLabelsRef.current = [];
    setUndoStack([]);
    if (!canvas.isDrawingMode) {
      canvas.isDrawingMode = true;
    }
    canvas.renderAll();
    onDrawingComplete("", [], 0, 0, null);
    toast.success(t("canvas.canvasCleared"));
  };

  // Keep only digits and a single decimal point, so a wall length can never be
  // stored as "12e" or "abc".
  const sanitizeDecimal = (raw: string) => {
    let out = raw.replace(/[^0-9.]/g, "");
    const firstDot = out.indexOf(".");
    if (firstDot !== -1) {
      out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, "");
    }
    return out;
  };

  const handleMeasurementChange = (index: number, raw: string) => {
    const clean = sanitizeDecimal(raw);
    // If anything was stripped, the visitor typed a letter (or a stray symbol) —
    // tell them why it didn't take.
    const hadInvalid = clean !== raw;
    setMeasurementErrors((prev) => {
      const next = { ...prev };
      if (hadInvalid) next[index] = t("canvas.errNumberOnly");
      else delete next[index];
      return next;
    });
    setWallMeasurements((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], length: clean };
      if (fabricCanvas) fireComplete(fabricCanvas, next);
      return next;
    });
  };

  const perimeter = wallMeasurements.reduce((sum, w) => sum + (parseFloat(w.length) || 0), 0);
  const lengths = wallMeasurements.map((w) => parseFloat(w.length) || 0).filter((l) => l > 0);
  let area = 0;
  if (lengths.length >= 2) {
    const sorted = [...lengths].sort((a, b) => a - b);
    area = sorted[0] * sorted[sorted.length - 1];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-espresso">{t("canvas.title")}</h3>
          <p className="text-sm text-brand-muted">{t("canvas.subtitle")}</p>
        </div>
      </div>

      <div className="p-3 bg-brand-sand/30 border border-brand-border rounded-lg">
        <p className="text-xs font-medium text-brand-muted mb-3">
          {spaceType === "Kitchen" ? "Kitchen layouts" : "Closet & garage layouts"} — tap one to place it
        </p>
        <div className="flex flex-wrap gap-3">
          {getLayouts(spaceType).map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => addShapeTemplate(tpl.id)}
              className="flex flex-col items-center gap-1.5 p-2.5 w-[104px] border-2 border-brand-border hover:border-brand-copper hover:bg-brand-copper/10 rounded-lg transition-all cursor-pointer"
              title={tpl.name}
            >
              <LayoutThumb path={tpl.path} />
            </button>
          ))}
        </div>
      </div>

      {/* How-to instruction, directly above the drawing area */}
      <div className="flex items-start gap-2 rounded-lg border border-brand-copper/40 bg-brand-copper/10 px-4 py-3">
        <Pencil className="w-4 h-4 mt-0.5 text-brand-copper flex-shrink-0" />
        <p className="text-sm text-brand-espresso">
          <span className="font-semibold">How to draw:</span> Click or tap, drag, and release to draw each wall.
          Continue until your room shape is complete.
        </p>
      </div>

      {/* Undo / Clear controls, sitting right on top of the drawing area */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleUndo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-border bg-white text-sm font-medium text-brand-espresso hover:bg-brand-sand transition-colors"
          title={t("canvas.undo")}
        >
          <Undo size={16} /> {t("canvas.undo")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          title={t("canvas.clear")}
        >
          <Trash2 size={16} /> {t("canvas.clear")}
        </button>
      </div>

      <div className="border-2 border-brand-border rounded-lg overflow-auto bg-white">
        <canvas ref={canvasRef} style={{ touchAction: "none" }} />
      </div>

      <div className="flex items-center justify-between text-xs text-brand-muted">
        <p>
          {t("canvas.wallsDrawn")}: {wallCount} / {MAX_WALLS}
        </p>
        <p>{t("canvas.drawingMode")}</p>
      </div>

      {wallMeasurements.length > 0 && (
        <div className="space-y-3 p-4 bg-brand-sand/30 border border-brand-border rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h4 className="font-semibold text-brand-espresso">{t("canvas.enterWallLengths")}</h4>
            {perimeter > 0 && (
              <div className="flex gap-4 text-sm">
                <div className="flex flex-col items-start">
                  <span className="text-brand-muted">{t("canvas.totalPerimeter")}</span>
                  <span className="font-semibold text-brand-copper">
                    {perimeter.toFixed(2)} {unit}
                  </span>
                </div>
                {area > 0 && (
                  <div className="flex flex-col items-start">
                    <span className="text-brand-muted">{t("canvas.estimatedArea")}</span>
                    <span className="font-semibold text-brand-copper">
                      {area.toFixed(2)} {unit}²
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wallMeasurements.map((wall, index) => (
              <div key={`${wall.label}-${index}`} className="space-y-1">
                <label className="text-sm font-medium text-brand-muted">
                  {t("step3.wall")} {wall.label} ({unit})
                </label>
                <input
                  id={`wall-${wall.label}`}
                  type="text"
                  inputMode="decimal"
                  value={wall.length}
                  onChange={(e) => handleMeasurementChange(index, e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-brand-copper focus:border-brand-copper ${
                    measurementErrors[index] ? "border-red-500" : "border-brand-border"
                  }`}
                  placeholder={`${t("canvas.enterWallLengths")} (${unit})`}
                  aria-invalid={!!measurementErrors[index]}
                />
                {measurementErrors[index] && (
                  <p className="text-xs text-red-500">{measurementErrors[index]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
