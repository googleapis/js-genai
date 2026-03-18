/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {GenerateContentResponse, GoogleGenAI} from '@google/genai';

/**
 * Component for demoing generate content.
 */
@Component({
  selector: 'demo-generate-content',
  standalone: true,
  templateUrl: './generate_content.ng.html',
  styleUrl: './generate_content.scss',
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateContent {
  readonly result = signal<string>('');
  promptInput = new FormControl('');
  onClickButton(): void {
    const prompt = this.promptInput.value!;
    console.log('prompt value: ', prompt);
    this.generateContent(prompt).then((response) => {
      this.result.set(response.text!);
    });
  }

  async generateContent(prompt: string): Promise<GenerateContentResponse> {
    const ai = new GoogleGenAI({
      // Note: It is unsafe to inject API key in web environment. Please use your own api key for local demo.
      apiKey: 'fake-api-key',
    });
    return ai.models.generateContent({
      model: 'models/gemini-2.0-flash',
      contents: prompt,
    });
  }
}
