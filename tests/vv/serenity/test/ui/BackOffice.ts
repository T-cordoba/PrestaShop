import { By, PageElement, PageElements } from '@serenity-js/web';

/** Targets of the BO, located by id/name (the form contract), never by visible text. */
export const LoginForm = {
  email: () => PageElement.located(By.css('form:has(input[name="passwd"]) input[name="email"]')).describedAs('campo de correo'),
  password: () => PageElement.located(By.css('input[name="passwd"]')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('form:has(input[name="passwd"]) [name="submit_login"]')).describedAs('botón Ingresar'),
};

export const Form = {
  field: (id: string, description: string) => PageElement.located(By.id(id)).describedAs(description),
  save: () => PageElement.located(By.css('#save-button, form[name="manufacturer"] button.btn-primary')).describedAs('botón Guardar'),
};

export const Notifications = {
  success: () => PageElement.located(By.css('.alert-success:not(#ajax_confirmation)')).describedAs('mensaje de éxito'),
};

export const Grid = {
  rows: (grid: string) => PageElements.located(By.css(`#${grid}_grid_table tbody tr`)).describedAs(`filas del listado ${grid}`),
  firstRowSwitch: (grid: string) => PageElement.located(By.css(`#${grid}_grid_table tbody tr:first-child .ps-switch`)).describedAs('interruptor de estado de la primera fila'),
};
