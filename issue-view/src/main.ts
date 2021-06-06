import { createApp } from 'vue'
import App from './App.vue'

declare var acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

createApp(App).mount('#app')
