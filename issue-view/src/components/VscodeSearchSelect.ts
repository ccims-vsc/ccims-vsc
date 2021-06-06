/**
 * Based on vscode-webview-elements (Copyright (c) 2020 Adam Bender)
 * See https://github.com/bendera/vscode-webview-elements
 * contains modified code from src/vscode-select/vscode-single-select.ts and src/vscode-select/includes/vscode-select-base.ts
 */

import {
    LitElement,
    property,
    internalProperty,
    query,
    html,
    TemplateResult
} from 'lit-element';
import { nothing } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map';
import '@bendera/vscode-webview-elements/dist/vscode-button';
import dropdownStyles from '@bendera/vscode-webview-elements/dist/vscode-select/includes/styles';
import { InternalOption, Option, SearchMethod } from '@bendera/vscode-webview-elements/dist/vscode-select/includes/types';
import { filterOptionsByPattern } from '@bendera/vscode-webview-elements/dist/vscode-select/includes/helpers';
import { chevronDownIcon } from '@bendera/vscode-webview-elements/dist/vscode-select/includes/template-elements';

const VISIBLE_OPTS = 10;
const OPT_HEIGHT = 19;
const LIST_HEIGHT = 192;


export class VscodeSearchSelect extends LitElement {
    @property({ type: String, attribute: true, reflect: true })
    role = 'listbox';

    @property({ type: String })
    set value(val: string) {
        this._value = val;
    }
    get value(): string {
        return this._value as string;
    }

    @property({ type: String })
    set placeholder(val: string) {
        this._placeholder = val;
    }
    get placeholder(): string {
        return this._placeholder;
    }

    @property({ type: String, reflect: true, attribute: 'aria-expanded' })
    ariaExpanded = 'false';

    @property({ type: Boolean, reflect: true, attribute: 'data-cloak' })
    dataCloak = false;

    /**
     * Filter method
     *
     * @attr [filter=fuzzy]
     * @type {"fuzzy"|"contains"|"startsWith"|"startsWithPerTerm"}
     */
    @property({ type: String })
    set filter(val: string) {
        const validValues: SearchMethod[] = [
            'contains',
            'fuzzy',
            'startsWith',
            'startsWithPerTerm',
        ];

        if (validValues.includes(val as SearchMethod)) {
            this._filter = val as SearchMethod;
        } else {
            throw new Error("invalid filter option");
        }
    }
    get filter(): string {
        return this._filter;
    }

    @property({ type: Boolean, reflect: true })
    focused = false;

    /**
     * @attr [options=[]]
     * @type {Option[]}
     */
    @property({ type: Array })
    set options(opts: Option[]) {
        this._options = opts.map((op, index) => ({ ...op, index }));
    }
    get options(): Option[] {
        return this._options.map(({ label, value, description, selected }) => ({
            label,
            value,
            description,
            selected,
        }));
    }

    @property({ type: Number, attribute: true, reflect: true })
    tabindex = 0;

    connectedCallback(): void {
        super.connectedCallback();
        this.dataCloak = false;
        this.addEventListener('keydown', this._onComponentKeyDown);
        this.addEventListener('focus', this._onComponentFocus);
        this.addEventListener('blur', this._onComponentBlur);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this._onComponentKeyDown);
        this.removeEventListener('focus', this._onComponentFocus);
        this.removeEventListener('blur', this._onComponentBlur);
    }

    @internalProperty()
    protected _activeIndex = -1;

    @internalProperty()
    protected _currentDescription = '';

    @internalProperty()
    protected _filter: SearchMethod = 'fuzzy';

    @internalProperty()
    protected get _filteredOptions(): InternalOption[] {
        return filterOptionsByPattern(
            this._options,
            this._filterPattern,
            this._filter
        );
    }

    @internalProperty()
    protected _placeholder = ';'

    @internalProperty()
    protected _filterPattern = '';

    @internalProperty()
    protected _showDropdown = false;

    @internalProperty()
    protected _options: InternalOption[] = [];

    @internalProperty()
    protected _value = '';

    @internalProperty()
    protected _values: string[] = [];

    @internalProperty()
    protected _listScrollTop = 0;

    @query('.main-slot')
    protected _mainSlot!: HTMLSlotElement;

    @query('.options')
    private _listElement!: HTMLUListElement;

    private _isHoverForbidden = false;

    protected get _currentOptions(): InternalOption[] {
        return this._filteredOptions;
    }

    protected async _toggleDropdown(visible: boolean): Promise<void> {
        this._showDropdown = visible;
        this.ariaExpanded = String(visible);

        if (visible) {
            window.addEventListener('click', this._onClickOutsideBound);
        } else {
            window.removeEventListener('click', this._onClickOutsideBound);
        }
    }

    protected _dispatchChangeEvent(): void {
        this.dispatchEvent(
            new CustomEvent('vsc-change', {
                detail: {
                    value: this._value
                }
            })
        );
    }

    protected _dispatchSearchTextEvent(): void {
        this.dispatchEvent(
            new CustomEvent('vsc-search-text', {
                detail: {
                    value: this._filterPattern
                }
            })
        );
    }

    protected _onFaceClick(): void {
        this._toggleDropdown(!this._showDropdown);
    }

    protected _onClickOutside(event: MouseEvent): void {
        const path = event.composedPath();
        const found = path.findIndex((et) => et === this);

        if (found === -1) {
            this._toggleDropdown(false);
            window.removeEventListener('click', this._onClickOutsideBound);
        }
    }

    protected _onClickOutsideBound = this._onClickOutside.bind(this);

    private _onMouseMove() {
        this._isHoverForbidden = false;
        window.removeEventListener('mousemove', this._onMouseMoveBound);
    }

    private _onMouseMoveBound = this._onMouseMove.bind(this);

    private _toggleComboboxDropdown() {
        this._filterPattern = '';
        this._toggleDropdown(!this._showDropdown);
    }

    protected _onComboboxButtonClick(): void {
        this._toggleComboboxDropdown();
    }

    protected _onComboboxButtonKeyDown(ev: KeyboardEvent): void {
        if (ev.key === 'Enter') {
            this._toggleComboboxDropdown();
        }
    }

    protected _onOptionMouseOver(ev: MouseEvent): void {
        if (this._isHoverForbidden) {
            return;
        }

        const el = ev.target as HTMLElement;

        if (!el.matches('.option')) {
            return;
        }

        this._activeIndex = Number(
            el.dataset.filteredIndex
        );
    }

    private _onOptionClick(ev: MouseEvent) {
        const composedPath = ev.composedPath();
        const optEl = composedPath.find((et) =>
            (et as HTMLElement)?.matches('li.option')
        );

        if (!optEl) {
            return;
        }

        const index = Number((optEl as HTMLElement).dataset.index);
        this._value = this._options[index].value;

        this._toggleDropdown(false);
        this._dispatchChangeEvent();
    }

    protected _onEnterKeyDown(): void {
        const list = this._filteredOptions;
        const showDropdownNext = !this._showDropdown;

        this._toggleDropdown(showDropdownNext);

        if (
            !showDropdownNext
        ) {
            this._value = this._options[list[this._activeIndex].index].value;
            this._dispatchChangeEvent();
        }

        if (showDropdownNext) {
            this.updateComplete.then(() => {
                this._scrollActiveElementToTop();
            });
        }
    }

    private _onSpaceKeyDown() {
        if (!this._showDropdown) {
            this._toggleDropdown(true);
            return;
        }
    }

    private _scrollActiveElementToTop() {
        this._listElement.scrollTop = Math.floor(this._activeIndex * OPT_HEIGHT);
    }

    private async _adjustOptionListScrollPos(direction: 'down' | 'up') {
        const numOpts = this._filteredOptions.length;

        if (numOpts <= VISIBLE_OPTS) {
            return;
        }

        this._isHoverForbidden = true;
        window.addEventListener('mousemove', this._onMouseMoveBound);

        if (!this._listElement) {
            await this.updateComplete;
        }

        const ulScrollTop = this._listElement.scrollTop;
        const liPosY = this._activeIndex * OPT_HEIGHT;

        if (direction === 'down') {
            if (liPosY + OPT_HEIGHT >= LIST_HEIGHT + ulScrollTop) {
                this._listElement.scrollTop =
                    (this._activeIndex - (VISIBLE_OPTS - 1)) * OPT_HEIGHT;
            }
        }

        if (direction === 'up') {
            if (liPosY <= ulScrollTop - OPT_HEIGHT) {
                this._scrollActiveElementToTop();
            }
        }
    }

    protected _onArrowUpKeyDown(): void {
        if (this._showDropdown) {
            if (this._activeIndex <= 0) {
                return;
            }

            this._activeIndex -= 1;
            this._adjustOptionListScrollPos('up');
        }
    }

    protected _onArrowDownKeyDown(): void {
        if (this._showDropdown) {
            if (this._activeIndex >= this._currentOptions.length - 1) {
                return;
            }

            this._activeIndex += 1;
            this._adjustOptionListScrollPos('down');
        }
    }

    private _onComponentKeyDown(event: KeyboardEvent) {
        if ([' ', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (event.key === 'Enter') {
            this._onEnterKeyDown();
        }

        if (event.key === ' ') {
            this._onSpaceKeyDown();
        }

        if (event.key === 'Escape') {
            this._toggleDropdown(false);
        }

        if (event.key === 'ArrowUp') {
            this._onArrowUpKeyDown();
        }

        if (event.key === 'ArrowDown') {
            this._onArrowDownKeyDown();
        }
    }

    private _onComponentFocus() {
        this.focused = true;
    }

    private _onComponentBlur() {
        this.focused = false;
    }

    protected _onComboboxInputFocus(ev: FocusEvent): void {
        (ev.target as HTMLInputElement).select();
    }

    protected _onComboboxInputInput(ev: InputEvent): void {
        this._filterPattern = (ev.target as HTMLInputElement).value;
        this._activeIndex = -1;
        this._toggleDropdown(true);
        this._dispatchSearchTextEvent();
    }

    protected _renderOptions(): TemplateResult | TemplateResult[] {
        const list = this._filteredOptions;

        const options = list.map((op, index) => {
            const classes = classMap({
                option: true,
                active: index === this._activeIndex,
            });

            return html`
		  <li
			class="${classes}"
			data-index="${op.index}"
			data-filtered-index="${index}"
		  >
			${op.label}
		  </li>
		`;
        });

        return html`
		<ul
		  class="options"
		  @mouseover="${this._onOptionMouseOver}"
		  @click="${this._onOptionClick}"
		>
		  ${options}
		</ul>
	  `;
    }

    private _renderDescription() {
        if (!this._options[this._activeIndex]) {
            return nothing;
        }

        const { description } = this._options[this._activeIndex];

        return description
            ? html`<div class="description">${description}</div>`
            : nothing;
    }

    protected _renderComboboxFace(): TemplateResult {
        return html`
	  <div class="combobox-face">
		<input
		  class="combobox-input"
		  spellcheck="false"
		  type="text"
		  .value=""
		  placeholder="${this._placeholder}"
		  @focus="${this._onComboboxInputFocus}"
		  @input="${this._onComboboxInputInput}"
		/>
		<button
		  class="combobox-button"
		  type="button"
		  @click="${this._onComboboxButtonClick}"
		  @keydown="${this._onComboboxButtonKeyDown}"
		>
		  ${chevronDownIcon}
		</button>
	  </div>
	`;
    }

    protected _renderDropdownControls(): TemplateResult {
        return html`${nothing}`;
    }

    private _renderDropdown() {
        const classes = classMap({
            dropdown: true,
        });

        return html`
		<div class="${classes}">
		  ${this._renderOptions()} ${this._renderDropdownControls()}
		  ${this._renderDescription()}
		</div>
	  `;
    }

    static styles = dropdownStyles;

    render(): TemplateResult {
        return html`
		${this._renderComboboxFace()}
		${this._showDropdown ? this._renderDropdown() : nothing}
	  `;
    }
}
