/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {
  bootstrap,
  getEl,
  setupModule,
} from 'google3/javascript/angular2/testing/catalyst/async';

import {GenerateContent} from './generate_content';

describe('GenerateContent Component', () => {
  beforeEach(() => {
    setupModule({
      imports: [
        GenerateContent,
        NoopAnimationsModule, // This makes test faster and more stable.
      ],
      providers: [provideRouter([])],
    });
  });

  it('should be created', () => {
    const component = bootstrap(GenerateContent);
    component.promptInput.setValue('test prompt');
    component.onClickButton();

    expect(component).toBeTruthy();
    expect(getEl('p').innerText).toBe('Result:');
  });
});
