import { PanelPlugin } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  const variables = getTemplateSrv().getVariables();

  return builder
    .addSelect({
      path: 'variable',
      name: 'Dashboard Variable',
      description: 'Select a dashboard variable to receive the polygon select results',
      defaultValue: '',
      settings: {
        options: variables.map(variable => ({
          label: variable.name,
          value: variable.name,
        })),
      },
    });
});
