const buildDate = new Date(__APP_BUILD_ID__);

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

const localBuildTime =
  `${buildDate.getFullYear()}-${pad(buildDate.getMonth() + 1)}-${pad(buildDate.getDate())} ` +
  `${pad(buildDate.getHours())}:${pad(buildDate.getMinutes())}`;

export const appVersionLabel = `v${__APP_VERSION__} · ${localBuildTime}`;
