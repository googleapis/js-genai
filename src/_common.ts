/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class BaseModule {}

export function formatMap(
  templateString: string,
  valueMap: Record<string, unknown>,
): string {
  // Use a regular expression to find all placeholders in the template string
  const regex = /\{([^}]+)\}/g;

  // Replace each placeholder with its corresponding value from the valueMap
  return templateString.replace(regex, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(valueMap, key)) {
      const value = valueMap[key];
      // Convert the value to a string if it's not a string already
      return value !== undefined && value !== null ? String(value) : '';
    } else {
      // Handle missing keys
      throw new Error(`Key '${key}' not found in valueMap.`);
    }
  });
}

export function setValueByPath(
  data: Record<string, unknown>,
  keys: string[],
  value: unknown,
): void {
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (key.endsWith('[]')) {
      const keyName = key.slice(0, -2);
      if (!(keyName in data)) {
        if (Array.isArray(value)) {
          data[keyName] = Array.from({length: value.length}, () => ({}));
        } else {
          throw new Error(`Value must be a list given an array path ${key}`);
        }
      }

      if (Array.isArray(data[keyName])) {
        const arrayData = data[keyName] as Array<unknown>;

        if (Array.isArray(value)) {
          for (let j = 0; j < arrayData.length; j++) {
            const entry = arrayData[j] as Record<string, unknown>;
            setValueByPath(entry, keys.slice(i + 1), value[j]);
          }
        } else {
          for (const d of arrayData) {
            setValueByPath(
              d as Record<string, unknown>,
              keys.slice(i + 1),
              value,
            );
          }
        }
      }
      return;
    } else if (key.endsWith('[0]')) {
      const keyName = key.slice(0, -3);
      if (!(keyName in data)) {
        data[keyName] = [{}];
      }
      const arrayData = (data as Record<string, unknown>)[keyName];
      setValueByPath(
        (arrayData as Array<Record<string, unknown>>)[0],
        keys.slice(i + 1),
        value,
      );
      return;
    }

    if (!data[key] || typeof data[key] !== 'object') {
      data[key] = {};
    }

    data = data[key] as Record<string, unknown>;
  }

  const keyToSet = keys[keys.length - 1];
  const existingData = data[keyToSet];

  if (existingData !== undefined) {
    if (
      !value ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    ) {
      return;
    }

    if (value === existingData) {
      return;
    }

    if (
      typeof existingData === 'object' &&
      typeof value === 'object' &&
      existingData !== null &&
      value !== null
    ) {
      Object.assign(existingData, value);
    } else {
      throw new Error(`Cannot set value for an existing key. Key: ${keyToSet}`);
    }
  } else {
    if (
      keyToSet === '_self' &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const valueAsRecord = value as Record<string, unknown>;

      Object.assign(data, valueAsRecord);
    } else {
      data[keyToSet] = value;
    }
  }
}

export function getValueByPath(
  data: unknown,
  keys: string[],
  defaultValue: unknown = undefined,
): unknown {
  try {
    if (keys.length === 1 && keys[0] === '_self') {
      return data;
    }

    for (let i = 0; i < keys.length; i++) {
      if (typeof data !== 'object' || data === null) {
        return defaultValue;
      }

      const key = keys[i];
      if (key.endsWith('[]')) {
        const keyName = key.slice(0, -2);
        if (keyName in data) {
          const arrayData = (data as Record<string, unknown>)[keyName];
          if (!Array.isArray(arrayData)) {
            return defaultValue;
          }
          return arrayData.map((d) =>
            getValueByPath(d, keys.slice(i + 1), defaultValue),
          );
        } else {
          return defaultValue;
        }
      } else {
        data = (data as Record<string, unknown>)[key];
      }
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Moves values from source paths to destination paths.
 *
 * Examples:
 *   moveValueByPath(
 *     {'requests': [{'content': v1}, {'content': v2}]},
 *     {'requests[].*': 'requests[].request.*'}
 *   )
 *     -> {'requests': [{'request': {'content': v1}}, {'request': {'content': v2}}]}
 */
export function moveValueByPath(
  data: unknown,
  paths: Record<string, string>,
): void {
  for (const [sourcePath, destPath] of Object.entries(paths)) {
    const sourceKeys = sourcePath.split('.');
    const destKeys = destPath.split('.');

    // Determine keys to exclude from wildcard to avoid cyclic references
    const excludeKeys = new Set<string>();
    let wildcardIdx = -1;
    for (let i = 0; i < sourceKeys.length; i++) {
      if (sourceKeys[i] === '*') {
        wildcardIdx = i;
        break;
      }
    }

    if (wildcardIdx !== -1 && destKeys.length > wildcardIdx) {
      // Extract the intermediate key between source and dest paths
      // Example: source=['requests[]', '*'], dest=['requests[]', 'request', '*']
      // We want to exclude 'request'
      for (let i = wildcardIdx; i < destKeys.length; i++) {
        const key = destKeys[i];
        if (key !== '*' && !key.endsWith('[]') && !key.endsWith('[0]')) {
          excludeKeys.add(key);
        }
      }
    }

    _moveValueRecursive(data, sourceKeys, destKeys, 0, excludeKeys);
  }
}

/**
 * Recursively moves values from source path to destination path.
 */
function _moveValueRecursive(
  data: unknown,
  sourceKeys: string[],
  destKeys: string[],
  keyIdx: number,
  excludeKeys: Set<string>,
): void {
  if (keyIdx >= sourceKeys.length) {
    return;
  }

  if (typeof data !== 'object' || data === null) {
    return;
  }

  const key = sourceKeys[keyIdx];

  if (key.endsWith('[]')) {
    const keyName = key.slice(0, -2);
    const dataRecord = data as Record<string, unknown>;
    if (keyName in dataRecord && Array.isArray(dataRecord[keyName])) {
      for (const item of dataRecord[keyName] as Array<unknown>) {
        _moveValueRecursive(
          item,
          sourceKeys,
          destKeys,
          keyIdx + 1,
          excludeKeys,
        );
      }
    }
  } else if (key === '*') {
    // wildcard - move all fields
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const dataRecord = data as Record<string, unknown>;
      const keysToMove = Object.keys(dataRecord).filter(
        (k) => !k.startsWith('_') && !excludeKeys.has(k),
      );

      const valuesToMove: Record<string, unknown> = {};
      for (const k of keysToMove) {
        valuesToMove[k] = dataRecord[k];
      }

      // Set values at destination
      for (const [k, v] of Object.entries(valuesToMove)) {
        const newDestKeys: string[] = [];
        for (const dk of destKeys.slice(keyIdx)) {
          if (dk === '*') {
            newDestKeys.push(k);
          } else {
            newDestKeys.push(dk);
          }
        }
        setValueByPath(dataRecord, newDestKeys, v);
      }

      for (const k of keysToMove) {
        delete dataRecord[k];
      }
    }
  } else {
    // Navigate to next level
    const dataRecord = data as Record<string, unknown>;
    if (key in dataRecord) {
      _moveValueRecursive(
        dataRecord[key],
        sourceKeys,
        destKeys,
        keyIdx + 1,
        excludeKeys,
      );
    }
  }
}
