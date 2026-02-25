import { createHierarchicalTemplateStore } from '../templates/hierarchicalTemplateStore.js';

const BORDER_TEMPLATE_ROOT_NAME = 'All Border Templates';
const DEFAULT_BORDER_TEMPLATE_ID = 'template-border-default';

const DEFAULT_BORDER_TEMPLATE_DATA = {
  borderWidthValue: '2',
  borderRadiusValue: '16',
  colorMode: 'solid',
  color: '#1f2937',
  insideOutColorValues: ['#1f2937', '#9ca3af'],
  backgroundMode: 'transparent',
  backgroundColor: '#ffffff',
  centerPaddingValue: '24',
  lockState: {
    top: true,
    right: true,
    bottom: true,
    left: true,
  },
  sidePaddingValues: {
    top: '24',
    right: '24',
    bottom: '24',
    left: '24',
  },
  paddingRounding: {
    horizontal: 'none',
    vertical: 'none',
  },
  imageBorder: {
    corners: {
      topLeft: { imageId: null, rotation: 0, flipX: false, flipY: false },
      topRight: { imageId: null, rotation: 0, flipX: false, flipY: false },
      bottomRight: { imageId: null, rotation: 0, flipX: false, flipY: false },
      bottomLeft: { imageId: null, rotation: 0, flipX: false, flipY: false },
    },
    sides: {
      top: { imageId: null, rotation: 0, flipX: false, flipY: false },
      right: { imageId: null, rotation: 0, flipX: false, flipY: false },
      bottom: { imageId: null, rotation: 0, flipX: false, flipY: false },
      left: { imageId: null, rotation: 0, flipX: false, flipY: false },
    },
    sizingStrategy: 'auto',
    sideMode: 'stretch',
  },
};

export function createTemplateLibraryStore() {
  return createHierarchicalTemplateStore({
    rootFolderName: BORDER_TEMPLATE_ROOT_NAME,
    defaultTemplates: [
      {
        id: DEFAULT_BORDER_TEMPLATE_ID,
        name: 'Default',
        parentId: 'root',
        orderIndex: 0,
        templateClass: 'border',
        data: DEFAULT_BORDER_TEMPLATE_DATA,
        immutable: true,
      },
    ],
  });
}

export {
  BORDER_TEMPLATE_ROOT_NAME,
  DEFAULT_BORDER_TEMPLATE_ID,
};
