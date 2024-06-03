import {
  faArrowRightArrowLeft,
  faCaretSquareDown,
  faCaretSquareUp,
  faCheckSquare,
  faClone,
  faCopy,
  faCropAlt,
  faCut,
  faFilter,
  faPaste,
  faPen,
  faPlus,
  faSortAmountDownAlt,
  faSquare,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons'
import {
  canConvert,
  getFocusPath,
  isKeySelection,
  isMultiSelection,
  isValueSelection,
  singleItemSelected
} from '$lib/logic/selection'
import type { ConvertType, DocumentState, InsertType, JSONParser } from '$lib/types'
import { initial, isEmpty } from 'lodash-es'
import { compileJSONPointer, getIn } from 'immutable-json-patch'
import { isObjectOrArray, isObject } from '$lib/utils/typeUtils'
import { getEnforceString } from '$lib/logic/documentState'
import type { ContextMenuItem } from 'svelte-jsoneditor'

export default function ({
  json,
  documentState,
  readOnly,
  parser,
  onEditKey,
  onEditValue,
  onToggleEnforceString,
  onCut,
  onCopy,
  onPaste,
  onRemove,
  onDuplicate,
  onExtract,
  onInsertBefore,
  onInsert,
  onConvert,
  onInsertAfter,
  onSort,
  onTransform
}: {
  json: unknown
  documentState: DocumentState
  readOnly: boolean
  parser: JSONParser
  onEditKey: () => void
  onEditValue: () => void
  onToggleEnforceString: () => void
  onCut: (indent: boolean) => void
  onCopy: (indent: boolean) => void
  onPaste: () => void
  onRemove: () => void
  onDuplicate: () => void
  onExtract: () => void
  onInsertBefore: () => void
  onInsert: (type: InsertType) => void
  onConvert: (type: ConvertType) => void
  onInsertAfter: () => void
  onSort: () => void
  onTransform: () => void
}): ContextMenuItem[] {
  const selection = documentState.selection

  const hasJson = json !== undefined
  const hasSelection = !!selection
  const rootSelected = selection ? isEmpty(getFocusPath(selection)) : false
  const focusValue = selection ? getIn(json, getFocusPath(selection)) : undefined
  const editValueText = Array.isArray(focusValue)
    ? '编辑列表'
    : isObject(focusValue)
      ? '编辑对象'
      : '编辑值'

  const hasSelectionContents =
    hasJson &&
    (isMultiSelection(selection) || isKeySelection(selection) || isValueSelection(selection))

  const canEditKey =
    !readOnly &&
    hasJson &&
    selection != null &&
    singleItemSelected(selection) &&
    !rootSelected &&
    !Array.isArray(getIn(json, initial(getFocusPath(selection))))

  const canEditValue = !readOnly && hasJson && selection != null && singleItemSelected(selection)
  const canEnforceString = canEditValue && !isObjectOrArray(focusValue)

  const canCut = !readOnly && hasSelectionContents
  const canCopy = hasSelectionContents
  const canPaste = !readOnly && hasSelection
  const canDuplicate = !readOnly && hasJson && hasSelectionContents && !rootSelected // must not be root
  const canExtract =
    !readOnly &&
    hasJson &&
    selection != null &&
    (isMultiSelection(selection) || isValueSelection(selection)) &&
    !rootSelected // must not be root

  const convertMode = hasSelectionContents
  const insertOrConvertText = convertMode ? '转换为:' : '插入:'

  const canInsertOrConvertStructure = readOnly || convertMode ? false : hasSelection
  const canInsertOrConvertObject =
    !readOnly && (convertMode ? canConvert(selection) && !isObject(focusValue) : hasSelection)
  const canInsertOrConvertArray =
    !readOnly && (convertMode ? canConvert(selection) && !Array.isArray(focusValue) : hasSelection)
  const canInsertOrConvertValue =
    !readOnly && (convertMode ? canConvert(selection) && isObjectOrArray(focusValue) : hasSelection)

  const enforceString =
    selection != null && focusValue
      ? getEnforceString(
          focusValue,
          documentState.enforceStringMap,
          compileJSONPointer(getFocusPath(selection)),
          parser
        )
      : false

  function handleInsertOrConvert(type: InsertType) {
    if (hasSelectionContents) {
      if (type !== 'structure') {
        onConvert(type)
      }
    } else {
      onInsert(type)
    }
  }

  return [
    {
      type: 'row',
      items: [
        {
          type: 'button',
          onClick: () => onEditKey(),
          icon: faPen,
          text: '编辑键名',
          title: '编辑键名（双击键名）',
          disabled: !canEditKey
        },
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onEditValue(),
            icon: faPen,
            text: editValueText,
            title: '编辑值（双击值）',
            disabled: !canEditValue
          },
          width: '11em',
          items: [
            {
              type: 'button',
              icon: faPen,
              text: editValueText,
              title: '编辑值（双击值）',
              onClick: () => onEditValue(),
              disabled: !canEditValue
            },
            {
              type: 'button',
              icon: enforceString ? faCheckSquare : faSquare,
              text: '优先字符串',
              title: '强制保持值为字符串，当值包含数字时',
              onClick: () => onToggleEnforceString(),
              disabled: !canEnforceString
            }
          ]
        }
      ]
    },
    { type: 'separator' },
    {
      type: 'row',
      items: [
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onCut(true),
            icon: faCut,
            text: '剪切',
            title: '剪切选中内容，带有缩进格式 (Ctrl+X)',
            disabled: !canCut
          },
          width: '10em',
          items: [
            {
              type: 'button',
              icon: faCut,
              text: '格式化剪切',
              title: '剪切选中内容，带有缩进格式 (Ctrl+X)',
              onClick: () => onCut(true),
              disabled: !canCut
            },
            {
              type: 'button',
              icon: faCut,
              text: '紧凑剪切',
              title: '剪切选中内容，不带缩进格式 (Ctrl+Shift+X)',
              onClick: () => onCut(false),
              disabled: !canCut
            }
          ]
        },
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onCopy(true),
            icon: faCopy,
            text: '复制',
            title: '复制选中内容，带有缩进格式 (Ctrl+C)',
            disabled: !canCopy
          },
          width: '12em',
          items: [
            {
              type: 'button',
              icon: faCopy,
              text: '格式化复制',
              title: '复制选中内容，带有缩进格式 (Ctrl+C)',
              onClick: () => onCopy(true),
              disabled: !canCopy
            },
            {
              type: 'button',
              icon: faCopy,
              text: '紧凑复制',
              title: '复制选中内容，不带缩进格式 (Ctrl+Shift+C)',
              onClick: () => onCopy(false),
              disabled: !canCopy
            }
          ]
        },
        {
          type: 'button',
          onClick: () => onPaste(),
          icon: faPaste,
          text: '粘贴',
          title: '粘贴剪贴板内容 (Ctrl+V)',
          disabled: !canPaste
        }
      ]
    },
    { type: 'separator' },
    {
      type: 'row',
      items: [
        {
          type: 'column',
          items: [
            {
              type: 'button',
              onClick: () => onDuplicate(),
              icon: faClone,
              text: '复制',
              title: '复制选中内容',
              disabled: !canDuplicate
            },
            {
              type: 'button',
              onClick: () => onExtract(),
              icon: faCropAlt,
              text: '提取',
              title: '提取选中内容',
              disabled: !canExtract
            },
            {
              type: 'button',
              onClick: () => onSort(),
              icon: faSortAmountDownAlt,
              text: '排序',
              title: '对数组或对象内容进行排序',
              disabled: readOnly || !hasSelectionContents
            },
            {
              type: 'button',
              onClick: () => onTransform(),
              icon: faFilter,
              text: '转换',
              title: '转换数组或对象内容（过滤、排序、投影）',
              disabled: readOnly || !hasSelectionContents
            },
            {
              type: 'button',
              onClick: () => onRemove(),
              icon: faTrashCan,
              text: '删除',
              title: '删除选中内容',
              disabled: readOnly || !hasSelectionContents
            }
          ]
        },
        {
          type: 'column',
          items: [
            { type: 'label', text: insertOrConvertText },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('structure'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: '结构',
              title: insertOrConvertText + ' 结构',
              disabled: !canInsertOrConvertStructure
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('object'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: '对象',
              title: insertOrConvertText + ' 结构',
              disabled: !canInsertOrConvertObject
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('array'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: '列表',
              title: insertOrConvertText + ' 列表',
              disabled: !canInsertOrConvertArray
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('value'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: '值',
              title: insertOrConvertText + ' 值',
              disabled: !canInsertOrConvertValue
            }
          ]
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      type: 'row',
      items: [
        {
          type: 'button',
          onClick: () => onInsertBefore(),
          icon: faCaretSquareUp,
          text: '上方插入',
          title: '在当前条目上方插入或粘贴内容',
          disabled: readOnly || !hasSelectionContents || rootSelected
        },
        {
          type: 'button',
          onClick: () => onInsertAfter(),
          icon: faCaretSquareDown,
          text: '下方插入',
          title: '在当前条目下方插入或粘贴内容',
          disabled: readOnly || !hasSelectionContents || rootSelected
        }
      ]
    }
  ]
}
