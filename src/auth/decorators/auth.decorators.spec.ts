import 'reflect-metadata';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';

describe('auth decorators', () => {
  it('sets public route metadata', () => {
    const target = () => undefined;

    Public()(target);

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, target)).toBe(true);
  });

  it('sets role metadata', () => {
    const target = () => undefined;

    Roles('admin', 'seller')(target);

    expect(Reflect.getMetadata(ROLES_KEY, target)).toEqual(['admin', 'seller']);
  });
});
