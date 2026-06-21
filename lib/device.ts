export interface DeviceInfo {
  userAgent: string;
  device: string;
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  type: "mobile" | "tablet" | "desktop";
}

export function collectDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    device: parseDevice(ua),
    os: parseOS(ua),
    browser: parseBrowser(ua),
    screenWidth: screen.width,
    screenHeight: screen.height,
    type: detectType(ua),
  };
}

export function parseDeviceInfo(raw: string | null | undefined): DeviceInfo | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.userAgent) return parsed as DeviceInfo;
    // legacy: raw user-agent string
    return {
      userAgent: raw,
      device: parseDevice(raw),
      os: parseOS(raw),
      browser: parseBrowser(raw),
      screenWidth: 0,
      screenHeight: 0,
      type: detectType(raw),
    };
  } catch {
    return {
      userAgent: raw,
      device: parseDevice(raw),
      os: parseOS(raw),
      browser: parseBrowser(raw),
      screenWidth: 0,
      screenHeight: 0,
      type: detectType(raw),
    };
  }
}

function detectType(ua: string): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua))
    return "mobile";
  return "desktop";
}

function parseDevice(ua: string): string {
  // iPhone
  const iphone = ua.match(/iPhone/i);
  if (iphone) return "iPhone";

  // iPad
  if (/iPad/i.test(ua)) return "iPad";

  // Android device name
  const android = ua.match(/Android[^;]*;\s*([^)]+)\)/i);
  if (android) {
    const raw = android[1].trim();
    // clean up "Build/..." suffix
    return raw.replace(/\s+Build\/.*$/i, "").trim();
  }

  // Windows PC
  if (/Windows/i.test(ua)) return "Windows PC";

  // Mac
  if (/Macintosh/i.test(ua)) return "Mac";

  // Linux
  if (/Linux/i.test(ua)) return "Linux PC";

  return "Unknown device";
}

function parseOS(ua: string): string {
  // iOS
  const ios = ua.match(/OS\s([\d_]+)\s/i);
  if (ios && /iP(hone|od|ad)/i.test(ua)) {
    return "iOS " + ios[1].replace(/_/g, ".");
  }

  // Android
  const android = ua.match(/Android\s([\d.]+)/i);
  if (android) return "Android " + android[1];

  // Windows
  const win = ua.match(/Windows NT\s([\d.]+)/i);
  if (win) {
    const v: Record<string, string> = {
      "10.0": "Windows 11/10",
      "6.3": "Windows 8.1",
      "6.2": "Windows 8",
      "6.1": "Windows 7",
    };
    return v[win[1]] ?? "Windows NT " + win[1];
  }

  // macOS
  const mac = ua.match(/Mac OS X\s([\d_]+)/i);
  if (mac) return "macOS " + mac[1].replace(/_/g, ".");

  return "Unknown OS";
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return "Browser";
}
