/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class BaseModule {}
export function formatMap(
  templateString: string,
  valueMap: Record<string, any>,
): string {
  // Use a regular expression to find all placeholders in the template string
  const regex = /\{([^}]+)\}/g;

  // Replace each placeholder with its corresponding value from the valueMap
  return templateString.replace(regex, (match, key) => {
    if (valueMap.hasOwnProperty(key)) {
      return valueMap[key];
    } else {
      // Handle missing keys
      throw new Error(`Key '${key}' not found in valueMap ${valueMap}`);
    }
  });
}

export function setValueByPath(
  data: Record<string, any>,
  keys: string[],
  value: any,
): void {
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key.endsWith('[]')) {
      const keyName = key.slice(0, -2);
      if (!(keyName in data)) {
        if (Array.isArray(value)) {
          data[keyName] = Array.from({length: value.length}, () => ({}));
        } else {
          throw new Error(
            `value ${value} must be a list given an array path ${key}`,
          );
        }
      }
      if (Array.isArray(value)) {
        for (let j = 0; j < data[keyName].length; j++) {
          setValueByPath(data[keyName][j], keys.slice(i + 1), value[j]);
        }
      } else {
        for (const d of data[keyName]) {
          setValueByPath(d, keys.slice(i + 1), value);
        }
      }
      return;
    }
    if (!data[key] || typeof data[key] !== 'object') {
      data[key] = {};
    }
    data = data[key] as Record<string, any>;
  }
  data[keys[keys.length - 1]] = value;
}

export function getValueByPath(data: object | any, keys: string[]): any | null {
  try {
    if (keys.length === 1 && keys[0] === '_self') {
      return data;
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.endsWith('[]')) {
        const keyName = key.slice(0, -2);
        if (keyName in data) {
          return data[keyName].map((d: any) =>
            getValueByPath(d, keys.slice(i + 1)),
          );
        } else {
          return undefined;
        }
      } else {
        data = data[key];
      }
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      return undefined;
    }
    throw error;
  }
}
