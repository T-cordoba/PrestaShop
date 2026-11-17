import { d, Duration, Masked, Task, Wait } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';
import { Click, Enter, Navigate, Page, Select } from '@serenity-js/web';
import { includes } from '@serenity-js/assertions';

import { BASE_URL, env } from '../../features/support/serenity.config';
import { NavigateInTheBackOffice, SetTheSwitch } from '../interactions/BackOfficeInteractions';
import { Form, LoginForm } from '../ui/BackOffice';

export const SignInToTheBackOffice = () => Task.where(`#actor inicia sesión en el back office`,
  Navigate.to(`${BASE_URL}/admin-dev/`),
  Wait.until(LoginForm.password(), isVisible()),
  Enter.theValue(env.BO_EMAIL).into(LoginForm.email()),
  Enter.theValue(Masked.valueOf(env.BO_PASSWORD)).into(LoginForm.password()),
  Click.on(LoginForm.submit()),
  Wait.upTo(Duration.ofSeconds(120)).until(Page.current().url().href, includes('_token=')),
);

// Enter replaces the field content (Playwright fill), so an empty value clears it.
const typeInto = (id: string, description: string, value: string) => Enter.theValue(value).into(Form.field(id, description));

const setEnabled = (prefix: string, enabled: boolean) => SetTheSwitch.named(prefix).to(enabled);

// --- RF-01 / RF-02 Impuestos (Juliana) -----------------------------------------------------------------------------
export const CreateTax = {
  named: (name: string) => ({
    withRate: (rate: string, enabled = true) => Task.where(d`#actor crea el impuesto ${name} con tasa ${rate}`,
      NavigateInTheBackOffice.to('improve/international/taxes/new'),
      typeInto('tax_name_1', 'nombre del impuesto', name),
      typeInto('tax_rate', 'tasa', rate),
      setEnabled('tax_is_enabled', enabled),
      Click.on(Form.save()),
    ),
  }),
};

// --- RF-03 Zonas (Juliana) ------------------------------------------------------------------------------------------
export const CreateZone = {
  named: (name: string, enabled = true) => Task.where(d`#actor crea la zona ${name}`,
    NavigateInTheBackOffice.to('improve/international/zones/new'),
    typeInto('zone_name', 'nombre de la zona', name),
    setEnabled('zone_enabled', enabled),
    Click.on(Form.save()),
  ),
};

// --- RF-05 Países (Juliana) -----------------------------------------------------------------------------------------
export const CreateCountry = {
  named: (name: string) => ({
    withIso: (iso: string, prefix = '57', zone = 'South America') => Task.where(d`#actor crea el país ${name} con ISO ${iso}`,
      NavigateInTheBackOffice.to('improve/international/countries/new'),
      typeInto('country_name_1', 'nombre del país', name),
      typeInto('country_iso_code', 'código ISO', iso),
      typeInto('country_call_prefix', 'prefijo telefónico', prefix),
      Select.option(zone).from(Form.field('country_zone', 'zona')),
      Click.on(Form.save()),
    ),
  }),
};

// --- RF-06 Marcas (Tomás) -------------------------------------------------------------------------------------------
export const CreateBrand = {
  named: (name: string, enabled = true) => Task.where(d`#actor crea la marca ${name}`,
    NavigateInTheBackOffice.to('sell/catalog/brands/new'),
    typeInto('manufacturer_name', 'nombre de la marca', name),
    setEnabled('manufacturer_is_enabled', enabled),
    Click.on(Form.save()),
  ),
};

// --- RF-10 Valores de característica (Tomás) ------------------------------------------------------------------------
export const AddFeatureValue = {
  of: (feature: string, value: string) => Task.where(d`#actor agrega el valor ${value} a la característica ${feature}`,
    NavigateInTheBackOffice.to('sell/catalog/features/new-value'),
    Select.option(feature).from(Form.field('feature_value_feature_id', 'característica')),
    typeInto('feature_value_value_1', 'valor', value),
    Click.on(Form.save()),
  ),
};
