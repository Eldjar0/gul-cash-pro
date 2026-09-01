import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { VirtualNumericKeypad } from "@/components/pos/VirtualNumericKeypad";

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, inputMode, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const [showKeypad, setShowKeypad] = React.useState(false);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 });

    const isNumeric =
      type === "number" || inputMode === "numeric" || inputMode === "decimal";
    const keypadEnabled = isNumeric && !props.readOnly && !props.disabled;

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const updatePosition = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width, 220);
      const keypadHeight = 280;
      const spaceBelow = window.innerHeight - r.bottom;
      const top =
        spaceBelow < keypadHeight && r.top > keypadHeight
          ? r.top - keypadHeight - 4
          : r.bottom + 4;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
      setPos({ top, left, width });
    }, []);

    React.useEffect(() => {
      if (!showKeypad) return;
      updatePosition();
      const handler = () => updatePosition();
      window.addEventListener("scroll", handler, true);
      window.addEventListener("resize", handler);
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Node;
        if (innerRef.current?.contains(target)) return;
        if ((target as HTMLElement)?.closest?.("[data-virtual-keypad]")) return;
        setShowKeypad(false);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      return () => {
        window.removeEventListener("scroll", handler, true);
        window.removeEventListener("resize", handler);
        document.removeEventListener("pointerdown", onPointerDown, true);
      };
    }, [showKeypad, updatePosition]);

    const handleKey = (key: string) => {
      const el = innerRef.current;
      if (!el) return;
      const current = el.value ?? "";
      let next = current;
      if (key === "C") next = "";
      else if (key === "←") next = current.slice(0, -1);
      else if (key === ".") {
        if (!current.includes(".")) next = current === "" ? "0." : current + ".";
      } else next = current + key;
      setNativeValue(el, next);
    };

    return (
      <>
        <input
          type={type}
          inputMode={keypadEnabled ? "none" : inputMode}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={setRefs}
          {...props}
          onFocus={(e) => {
            if (keypadEnabled) setShowKeypad(true);
            props.onFocus?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowKeypad(false);
            props.onKeyDown?.(e);
          }}
        />
        {keypadEnabled && showKeypad
          ? createPortal(
              <div
                data-virtual-keypad
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  zIndex: 9999,
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="rounded-lg border bg-popover p-2 shadow-lg"
              >
                <VirtualNumericKeypad onKey={handleKey} />
              </div>,
              document.body,
            )
          : null}
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
