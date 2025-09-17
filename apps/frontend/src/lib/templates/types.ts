import type { CreateTemplateDto } from 'shared-types';

export type TemplateLocal = CreateTemplateDto & {
  id: string;
  variables: string[];
  createdAt: string;
};
