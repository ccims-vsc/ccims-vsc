import { createApp } from 'vue';
import App from './App.vue';

declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

createApp(App).mount('#app');
