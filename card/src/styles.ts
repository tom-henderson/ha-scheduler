import { css } from "lit";

/**
 * Shared tokens and control styles. Chrome is driven by HA theme variables so
 * the card adapts to light/dark and custom themes; per-type accent colours are
 * passed in as inline `--accent` custom properties by the bar.
 */
export const sharedStyles = css`
  :host {
    --ds-track-bg: var(--secondary-background-color, #0d1116);
    --ds-panel: var(--card-background-color, #1a2029);
    --ds-panel-hi: var(--secondary-background-color, #222b36);
    --ds-line: var(--divider-color, #2c3644);
    --ds-text: var(--primary-text-color, #e8edf2);
    --ds-dim: var(--secondary-text-color, #8a97a6);
    --ds-accent: var(--primary-color, #03a9f4);
    --ds-warn: var(--warning-color, #f5934e);
    --ds-now: var(--error-color, #ff5a6e);
    --ds-sun: #f5b301;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
  }
  .btn.primary {
    background: var(--ds-accent);
    color: var(--text-primary-color, #fff);
    flex: 1;
  }
  .btn.ghost {
    background: transparent;
    border: 1px solid var(--ds-line);
    color: var(--ds-dim);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 6px;
  }

  .popover {
    position: absolute;
    z-index: 20;
    top: 50px;
    left: 0;
    right: 0;
    margin: 0 auto;
    background: var(--ds-panel-hi);
    border-radius: 12px;
    border: 1px solid var(--ds-line);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    padding: 14px;
    color: var(--ds-text);
  }
  .popover-head {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .popover-head span {
    font-size: 12.5px;
    font-weight: 700;
  }
  .popover-head button {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--ds-dim);
    cursor: pointer;
    padding: 2px;
    display: inline-flex;
  }
  .field-label {
    font-size: 11px;
    color: var(--ds-dim);
    margin-bottom: 4px;
  }
  .state-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .state-buttons button {
    padding: 6px 11px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid var(--ds-line);
    background: transparent;
    color: var(--ds-dim);
    font-family: inherit;
  }
  .state-buttons button.sel {
    border-color: var(--accent, var(--ds-accent));
    background: color-mix(in srgb, var(--accent, var(--ds-accent)) 18%, transparent);
    color: var(--ds-text);
  }
  input.time {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 9px;
    border-radius: 8px;
    border: 1px solid var(--ds-line);
    background: var(--ds-track-bg);
    color: var(--ds-text);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    font-family: inherit;
  }
`;
