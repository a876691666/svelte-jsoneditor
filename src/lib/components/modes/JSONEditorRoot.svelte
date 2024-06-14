<script lang="ts">
  import type {
    Content,
    ContextMenuItem,
    JSONEditorSelection,
    JSONParser,
    JSONPatchResult,
    JSONPathParser,
    MenuItem,
    MenuSeparator,
    OnBlur,
    OnChange,
    OnChangeMode,
    OnClassName,
    OnError,
    OnFocus,
    OnJSONEditorModal,
    OnRenderContextMenu,
    OnRenderContextMenuInternal,
    OnRenderMenu,
    OnRenderMenuInternal,
    OnRenderValue,
    OnSelect,
    OnSortModal,
    OnTransformModal,
    Validator
  } from '$lib/types'
  import { Mode } from '$lib/types.js'
  import TextMode from './textmode/TextMode.svelte'
  import type { JSONPatchDocument } from 'immutable-json-patch'
  import { isMenuSpace } from '$lib/typeguards.js'
  import { cloneDeep } from 'lodash-es'

  export let content: Content
  export let selection: JSONEditorSelection | null

  export let readOnly: boolean
  export let indentation: number | string
  export let tabSize: number
  export let mode: Mode
  export let mainMenuBar: boolean
  export let navigationBar: boolean
  export let statusBar: boolean
  export let askToFormat: boolean
  export let escapeControlCharacters: boolean
  export let escapeUnicodeCharacters: boolean
  export let flattenColumns: boolean
  export let parser: JSONParser
  export let parseMemoizeOne: JSONParser['parse']
  export let validator: Validator | null
  export let validationParser: JSONParser
  export let pathParser: JSONPathParser
  export let insideModal: boolean

  export let onChange: OnChange
  export let onChangeMode: OnChangeMode
  export let onSelect: OnSelect
  export let onRenderValue: OnRenderValue
  export let onClassName: OnClassName
  export let onRenderMenu: OnRenderMenu
  export let onRenderContextMenu: OnRenderContextMenu
  export let onError: OnError
  export let onFocus: OnFocus
  export let onBlur: OnBlur
  export let onSortModal: OnSortModal
  export let onTransformModal: OnTransformModal
  export let onJSONEditorModal: OnJSONEditorModal

  let refTextMode: TextMode | undefined

  const separatorMenuItem: MenuSeparator = {
    type: 'separator'
  }

  let handleRenderMenu: OnRenderMenuInternal
  $: handleRenderMenu = (items: MenuItem[]) => {
    const updatedItems = isMenuSpace(items[0]) ? items : items.concat(separatorMenuItem)

    const updatedItemsOriginal = cloneDeep(updatedItems) // the user may change updatedItems in the callback

    return (
      onRenderMenu(updatedItems, { mode, modal: insideModal, readOnly }) || updatedItemsOriginal
    )
  }

  let handleRenderContextMenu: OnRenderContextMenuInternal
  $: handleRenderContextMenu = (items: ContextMenuItem[]) => {
    const itemsOriginal = cloneDeep(items) // the user may change items in the callback

    return (
      onRenderContextMenu(items, { mode, modal: insideModal, readOnly, selection }) ??
      (readOnly ? false : itemsOriginal)
    )
  }

  export function patch(operations: JSONPatchDocument): JSONPatchResult {
    if (refTextMode) {
      return refTextMode.patch(operations)
    }

    throw new Error(`Method patch is not available in mode "${mode}"`)
  }

  /**
   * In tree mode, invalid JSON is automatically repaired when loaded. When the
   * repair was successful, the repaired contents are rendered but not yet
   * applied to the document itself until the user clicks "Ok" or starts editing
   * the data. Instead of accepting the repair, the user can also click
   * "Repair manually instead". Invoking `.acceptAutoRepair()` will
   * programmatically accept the repair. This will trigger an update,
   * and the method itself also returns the updated contents. In case of text
   * mode or when the editor is not in an "accept auto repair" status, nothing
   * will happen, and the contents will be returned as is.
   */
  export function acceptAutoRepair(): Content {
    return content
  }

  export async function refresh(): Promise<void> {
    if (refTextMode) {
      await refTextMode.refresh()
    } else {
      // nothing to do in tree or table mode (also: don't throw an exception or so,
      // that annoying having to reckon with that when using .refresh()).
    }
  }
</script>

<TextMode
  bind:this={refTextMode}
  externalContent={content}
  externalSelection={selection}
  {readOnly}
  {indentation}
  {tabSize}
  {mainMenuBar}
  {statusBar}
  {askToFormat}
  {escapeUnicodeCharacters}
  {parser}
  {validator}
  {validationParser}
  {onChange}
  {onSelect}
  {onChangeMode}
  {onError}
  {onFocus}
  {onBlur}
  onRenderMenu={handleRenderMenu}
  {onSortModal}
  {onTransformModal}
/>
