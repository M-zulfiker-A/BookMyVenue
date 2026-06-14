// Infrastructure — minimal typed DI container.
// Tokens carry their resolved type via a phantom field, giving full type
// inference at `resolve()` sites without runtime metadata / decorators.

export interface InjectionToken<T> {
  readonly key: symbol;
  readonly name: string;
  // phantom — never read at runtime, only used for inference
  readonly _type?: T;
}

export function token<T>(name: string): InjectionToken<T> {
  return { key: Symbol(name), name };
}

type Provider<T> = (c: Container) => T;

export class Container {
  private readonly providers = new Map<symbol, Provider<unknown>>();
  private readonly singletons = new Map<symbol, unknown>();

  /** Register a transient factory (called every resolve). */
  register<T>(t: InjectionToken<T>, provider: Provider<T>): this {
    this.providers.set(t.key, provider as Provider<unknown>);
    return this;
  }

  /** Register a singleton (memoised per container instance). */
  registerSingleton<T>(t: InjectionToken<T>, provider: Provider<T>): this {
    this.providers.set(t.key, (c) => {
      if (!this.singletons.has(t.key)) {
        this.singletons.set(t.key, provider(c));
      }
      return this.singletons.get(t.key);
    });
    return this;
  }

  /** Register an already-built value. */
  registerValue<T>(t: InjectionToken<T>, value: T): this {
    this.singletons.set(t.key, value);
    this.providers.set(t.key, () => this.singletons.get(t.key));
    return this;
  }

  resolve<T>(t: InjectionToken<T>): T {
    const p = this.providers.get(t.key);
    if (!p) throw new Error(`DI: no provider registered for ${t.name}`);
    return p(this) as T;
  }
}
