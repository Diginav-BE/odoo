odoo.define('mass_mailing.snippets.editor', function (require) {
'use strict';

const {_lt} = require('web.core');
const snippetsEditor = require('web_editor.snippet.editor');

const MassMailingSnippetsMenu = snippetsEditor.SnippetsMenu.extend({
    events: _.extend({}, snippetsEditor.SnippetsMenu.prototype.events, {
        'click .o_we_customize_design_btn': '_onDesignTabClick',
    }),
    custom_events: _.extend({}, snippetsEditor.SnippetsMenu.prototype.custom_events, {
        drop_zone_over: '_onDropZoneOver',
        drop_zone_out: '_onDropZoneOut',
        drop_zone_start: '_onDropZoneStart',
        drop_zone_stop: '_onDropZoneStop',
    }),
    tabs: _.extend({}, snippetsEditor.SnippetsMenu.prototype.tabs, {
        DESIGN: 'design',
    }),
    optionsTabStructure: [
        ['design-options', _lt("Design Options")],
    ],

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    start: function () {
        return this._super(...arguments).then(() => {
            this.$editable = this.options.wysiwyg.getEditable();
        });
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _onClick: function (ev) {
        this._super(...arguments);
        var srcElement = ev.target || (ev.originalEvent && (ev.originalEvent.target || ev.originalEvent.originalTarget)) || ev.srcElement;
        // When we select something and move our cursor too far from the editable area, we get the
        // entire editable area as the target, which causes the tab to shift from OPTIONS to BLOCK.
        // To prevent unnecessary tab shifting, we provide a selection for this specific case.
        if (srcElement.classList.contains('o_mail_wrapper') || srcElement.querySelector('.o_mail_wrapper')) {
            const selection = this.options.wysiwyg.odooEditor.document.getSelection();
            if (selection.anchorNode) {
                const parent = selection.anchorNode.parentElement;
                if (parent) {
                    srcElement = parent;
                }
                this._activateSnippet($(srcElement));
            }
        }
    },
    /**
     * @override
     */
    _insertDropzone: function ($hook) {
        const $hookParent = $hook.parent();
        const $dropzone = this._super(...arguments);
        $dropzone.attr('data-editor-message', $hookParent.attr('data-editor-message'));
        $dropzone.attr('data-editor-sub-message', $hookParent.attr('data-editor-sub-message'));
        return $dropzone;
    },
    /**
     * @override
     */
    _updateRightPanelContent: function ({content, tab}) {
        this._super(...arguments);
        this.$('.o_we_customize_design_btn').toggleClass('active', tab === this.tabs.DESIGN);
    },
    /**
     * @override
     */
    _computeSnippetTemplates: function (html) {
        const $html = $(html);
        const btnSelector = '.note-editable .oe_structure > div.o_mail_snippet_general .btn:not(.btn-link)';
        const $colorpickers = $html.find('[data-selector] > we-colorpicker[data-css-property="background-color"]');
        for (const colorpicker of $colorpickers) {
            const $option = $(colorpicker).parent();
            const selectors = $option.data('selector').split(',');
            const filteredSelectors = selectors.filter(selector => !selector.includes(btnSelector)).join(',');
            $option.attr('data-selector', filteredSelectors);
        }
        html = $html.toArray().map(node => node.outerHTML).join('');
        return this._super(html);
    },

    //--------------------------------------------------------------------------
    // Handler
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _onDropZoneOver: function () {
        this.$editable.find('.o_editable').css('background-color', '');
    },
    /**
     * @override
     */
    _onDropZoneOut: function () {
        const $oEditable = this.$editable.find('.o_editable');
        if ($oEditable.find('.oe_drop_zone.oe_insert:not(.oe_vertical):only-child').length) {
            $oEditable[0].style.setProperty('background-color', 'transparent', 'important');
        }
    },
    /**
     * @override
     */
    _onDropZoneStart: function () {
        const $oEditable = this.$editable.find('.o_editable');
        if ($oEditable.find('.oe_drop_zone.oe_insert:not(.oe_vertical):only-child').length) {
            $oEditable[0].style.setProperty('background-color', 'transparent', 'important');
        }
    },
    /**
     * @override
     */
    _onDropZoneStop: function () {
        const $oEditable = this.$editable.find('.o_editable');
        $oEditable.css('background-color', '');
        if (!$oEditable.find('.oe_drop_zone.oe_insert:not(.oe_vertical):only-child').length) {
            $oEditable.attr('contenteditable', true);
        }
        // Refocus again to save updates when calling `_onWysiwygBlur`
        this.$editable.focus();
    },
    /**
     * @override
     */
    _onSnippetRemoved: function () {
        this._super(...arguments);
        const $oEditable = this.$editable.find('.o_editable');
        if (!$oEditable.children().length) {
            $oEditable.empty(); // remove any superfluous whitespace
            $oEditable.attr('contenteditable', false);
        }
    },
    /**
     * @private
     */
    async _onDesignTabClick() {
        // Note: nothing async here but start the loading effect asap
        let releaseLoader;
        try {
            const promise = new Promise(resolve => releaseLoader = resolve);
            this._execWithLoadingEffect(() => promise, false, 0);
            // loader is added to the DOM synchronously
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            // ensure loader is rendered: first call asks for the (already done) DOM update,
            // second call happens only after rendering the first "updates"

            if (!this.topFakeOptionEl) {
                let el;
                for (const [elementName, title] of this.optionsTabStructure) {
                    const newEl = document.createElement(elementName);
                    newEl.dataset.name = title;
                    if (el) {
                        el.appendChild(newEl);
                    } else {
                        this.topFakeOptionEl = newEl;
                    }
                    el = newEl;
                }
                this.bottomFakeOptionEl = el;
                this.el.appendChild(this.topFakeOptionEl);
            }

            // Need all of this in that order so that:
            // - the element is visible and can be enabled and the onFocus method is
            //   called each time.
            // - the element is hidden afterwards so it does not take space in the
            //   DOM, same as the overlay which may make a scrollbar appear.
            this.topFakeOptionEl.classList.remove('d-none');
            const editorPromise = this._activateSnippet($(this.bottomFakeOptionEl));
            releaseLoader(); // because _activateSnippet uses the same mutex as the loader
            releaseLoader = undefined;
            const editor = await editorPromise;
            this.topFakeOptionEl.classList.add('d-none');
            editor.toggleOverlay(false);

            this._updateRightPanelContent({
                tab: this.tabs.DESIGN,
            });
        } catch (e) {
            // Normally the loading effect is removed in case of error during the action but here
            // the actual activity is happening outside of the action, the effect must therefore
            // be cleared in case of error as well
            if (releaseLoader) {
                releaseLoader();
            }
            throw e;
        }
    },
});

return MassMailingSnippetsMenu;

});
