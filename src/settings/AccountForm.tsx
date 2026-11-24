import { type ComponentProps, type FormEvent, useState } from 'react'
import type { NengyongBotBridge } from '../../shared/bridge'
import {
  ACCOUNT_NAME_MAX,
  type AccountUse,
  type AccountView,
  type ModelServicesView,
  type Service,
} from '../../shared/modelServices'
import { ipcErrorMessage } from '../ipcErrorMessage'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'
import { ServiceLogo } from './ModelLogo'
import { strings } from '../../shared/strings'

interface Props {
  service: Service
  account: AccountView | null // null: connecting a new one
  usedFor: string[] // the uses set to this account, named, to say what disconnecting turns off
  use: AccountUse | null // what it is being connected for
  bridge: Pick<NengyongBotBridge, 'saveAccount' | 'removeAccount'>
  onBack: (() => void) | null // back to the list it was picked from
  onDone: (services: ModelServicesView) => void
  onClose: () => void
}

/** Connecting or changing one account. Saving checks the address and key first and keeps nothing that does not work. */
export function AccountForm({ service, account, usedFor, use, bridge, onBack, onDone, onClose }: Props) {
  const words = strings().models.account
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState(account?.baseURL ?? service.baseURL)
  const [name, setName] = useState(account?.name ?? '')
  const [isKeyShown, setIsKeyShown] = useState(false)
  const [isAddressShown, setIsAddressShown] = useState(service.kind !== 'key' || baseURL !== service.baseURL)
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const isChanged = !account || apiKey.trim() !== '' || baseURL !== account.baseURL || name !== account.name
  const keepsKey = account !== null && baseURL === account.baseURL
  const isComplete =
    (service.kind !== 'key' || keepsKey || apiKey.trim() !== '') &&
    (service.kind !== 'custom' || (name.trim() !== '' && baseURL.trim() !== ''))

  const run = async (request: () => Promise<ModelServicesView>) => {
    setIsPending(true)
    setError('')
    try {
      onDone(await request())
    } catch (failure) {
      setError(ipcErrorMessage(failure))
      setIsPending(false)
    }
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isChanged || !isComplete || isPending) return
    void run(() => bridge.saveAccount({ id: account?.id ?? null, service: service.id, name, baseURL, apiKey }, use))
  }

  const keyField = (
    <Field
      id="account-key"
      label={words.apiKey}
      type={isKeyShown ? 'text' : 'password'}
      autoFocus
      autoComplete="off"
      value={apiKey}
      onChange={(event) => setApiKey(event.target.value)}
      placeholder={keyPlaceholder(service, account, keepsKey)}
    >
      <button
        type="button"
        onClick={() => setIsKeyShown((isShown) => !isShown)}
        aria-label={isKeyShown ? words.hideKey : words.showKey}
        className="absolute inset-y-0 right-1 my-auto grid size-7 place-items-center rounded-sm text-muted"
      >
        <Icon name={isKeyShown ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </Field>
  )
  const addressField = (
    <Field
      id="account-address"
      label={words.address}
      value={baseURL}
      onChange={(event) => setBaseURL(event.target.value)}
      placeholder={service.kind === 'custom' ? 'https://…/v1' : service.baseURL}
    />
  )

  return (
    <form onSubmit={submit} className="flex flex-col">
      <header className="flex items-center gap-2.5 pt-4 pr-3 pl-5">
        {onBack && <IconButton icon="arrowLeft" label={words.back} onClick={onBack} className="-ml-2.5" />}
        <ServiceLogo service={service.id} name={account?.name ?? service.name} size={28} />
        <h2 id="account-title" className="min-w-0 flex-1 truncate text-lg font-semibold">
          {titleOf(service, account)}
        </h2>
        <IconButton icon="close" label={words.close} onClick={onClose} />
      </header>
      <div className="flex flex-col gap-3.5 px-5 pt-3">
        {account && (
          <p className="text-sm text-muted">
            {usedFor.length ? strings().models.page.usedFor(usedFor) : strings().models.page.unused}
          </p>
        )}
        {service.kind === 'custom' && (
          <Field
            id="account-name"
            label={words.name}
            autoFocus={!account}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={words.namePlaceholder}
            maxLength={ACCOUNT_NAME_MAX}
          />
        )}
        {service.kind === 'local' && <p className="text-sm text-soft">{words.openLocalFirst(service.name)}</p>}
        {service.kind === 'key' && keyField}
        {isAddressShown && addressField}
        {service.kind !== 'key' && keyField}
        {service.kind === 'key' && (
          <div className="-mt-1.5 flex justify-between text-xs text-muted">
            {service.keyPage && (
              <a href={service.keyPage} target="_blank" rel="noreferrer" className="text-accent">
                {words.getKeyAt(new URL(service.keyPage).host)}
              </a>
            )}
            {!isAddressShown && (
              <button type="button" onClick={() => setIsAddressShown(true)} className="rounded-sm px-1 text-soft">
                {words.customAddress}
              </button>
            )}
          </div>
        )}
      </div>
      <footer className="flex flex-wrap items-center gap-2 px-5 py-4">
        {isConfirmingRemove && account ? (
          <>
            <p className="basis-full text-sm text-danger">
              {usedFor.length ? words.disconnectWarning(usedFor) : words.disconnectTitle(account.name)}
            </p>
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(false)}
              className="ml-auto h-8 rounded-md px-3 text-sm"
            >
              {words.neverMind}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void run(() => bridge.removeAccount(account.id))}
              className="h-8 rounded-md bg-danger px-3.5 text-sm text-white disabled:opacity-30"
            >
              {words.disconnect}
            </button>
          </>
        ) : (
          <>
            <p role="alert" className="basis-full text-sm text-danger empty:hidden">
              {error}
            </p>
            {account && (
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(true)}
                className="-ml-2.5 h-8 rounded-md px-2.5 text-sm text-danger"
              >
                {words.disconnect}
              </button>
            )}
            <button type="button" onClick={onClose} className="ml-auto h-8 rounded-md px-3 text-sm">
              {words.cancel}
            </button>
            <button
              type="submit"
              disabled={!isChanged || !isComplete || isPending}
              className="h-8 rounded-md bg-ink px-3.5 text-sm text-canvas transition-opacity disabled:opacity-30"
            >
              {isPending ? words.checking : verbOf(service, account)}
            </button>
          </>
        )}
      </footer>
    </form>
  )
}

function keyPlaceholder(service: Service, account: AccountView | null, keepsKey: boolean): string {
  const words = strings().models.account
  if (account?.keyHint && keepsKey) return words.keyKept(account.keyHint)
  if (account?.keyHint) return words.keyAgain
  return service.kind === 'key' ? words.pasteKey : words.keyOptional
}

function titleOf(service: Service, account: AccountView | null): string {
  if (account) return account.name
  return service.kind === 'custom'
    ? strings().models.account.addCompatible
    : strings().models.account.connectService(service.name)
}

function verbOf(service: Service, account: AccountView | null): string {
  const words = strings().models.account
  if (account) return words.save
  switch (service.kind) {
    case 'key':
      return words.connect
    case 'local':
      return words.attach
    case 'custom':
      return words.add
    default:
      return service.kind satisfies never
  }
}

/** A labelled one-line input of the form; `children` is an adornment at its right edge. */
function Field({ id, label, children, ...input }: ComponentProps<'input'> & { id: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          spellCheck={false}
          {...input}
          className="h-9 w-full rounded-md border border-line bg-surface pr-9 pl-3 font-mono text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-sans placeholder:text-muted/70 focus:border-ink/20 focus:ring-3 focus:ring-ink/5"
        />
        {children}
      </div>
    </div>
  )
}
