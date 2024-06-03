<svelte:options immutable={true} />

<script lang="ts">
  import type { JSONPath } from 'immutable-json-patch'
  import { getIn, isJSONArray, isJSONObject } from 'immutable-json-patch'
  import type { JSONParser, OnChangeMode } from '$lib/types.js'
  import { Mode } from '$lib/types.js'
  import { valueType } from '$lib/utils/typeUtils.js'
  import { findNestedArrays } from '$lib/logic/table.js'
  import { isEmpty } from 'lodash-es'
  import { stringifyJSONPath } from '$lib/utils/pathUtils.js'

  export let text: string | undefined
  export let json: unknown | undefined
  export let readOnly: boolean
  export let parser: JSONParser
  export let openJSONEditorModal: (path: JSONPath) => void
  export let onChangeMode: OnChangeMode
  export let onClick: () => void

  $: action = readOnly ? '查看' : '编辑'

  let nestedArrayPaths: JSONPath[]
  $: nestedArrayPaths = json
    ? findNestedArrays(json)
        .slice(0, 99)
        .filter((path) => path.length > 0)
    : []
  $: hasNestedArrays = !isEmpty(nestedArrayPaths)
  $: isEmptyDocument = json === undefined && (text === '' || text === undefined)

  $: documentType = hasNestedArrays
    ? '包含嵌套数组的对象'
    : isEmptyDocument
      ? '一个空文档'
      : isJSONObject(json)
        ? '一个对象'
        : isJSONArray(json)
          ? '一个空数组' // 注意：也可以是一个包含对象但没有属性的数组
          : `一个 ${valueType(json, parser)}`

  function countItems(nestedArrayPath: JSONPath): number {
    return (getIn(json, nestedArrayPath) as JSONPath).length
  }
</script>

<div class="jse-table-mode-welcome" on:click={() => onClick()} role="none">
  <div class="jse-space jse-before" />

  <div class="jse-nested-arrays">
    <div class="jse-nested-arrays-title">{documentType}</div>
    <div class="jse-nested-arrays-info">
      {#if hasNestedArrays}
        对象不能在表格模式中打开。你可以打开一个嵌套数组，或者在结构模式中打开文档。
      {:else}
        {documentType} 不能在表格模式中打开。
      {/if}
      {#if isEmptyDocument && !readOnly}
        你可以在结构模式中打开文档，或者使用 <b>Ctrl+V</b> 粘贴一个 JSON 数组。
      {:else}
        你可以在结构模式中打开文档。
      {/if}
    </div>
    {#each nestedArrayPaths as nestedArrayPath}
      {@const count = countItems(nestedArrayPath)}

      <button
        type="button"
        class="jse-nested-array-action"
        on:click={() => openJSONEditorModal(nestedArrayPath)}
      >
        {action} "{stringifyJSONPath(nestedArrayPath)}"
        <span class="jse-nested-array-count">({count} {count !== 1 ? 'items' : 'item'})</span>
      </button>
    {/each}
    <button type="button" class="jse-nested-array-action" on:click={() => onChangeMode(Mode.tree)}>
      结构模式下 {action}
    </button>
  </div>

  <div class="jse-space jse-after" />
</div>

<style src="./TableModeWelcome.scss"></style>
