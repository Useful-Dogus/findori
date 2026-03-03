import AdminLoginForm from './AdminLoginForm'

const STATUS_MESSAGE: Record<string, string> = {
  expired: '세션이 만료되어 다시 로그인해야 합니다.',
  logged_out: '로그아웃되었습니다.',
}

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const nextParam = resolvedSearchParams.next
  const reasonParam = resolvedSearchParams.reason

  const nextPath = typeof nextParam === 'string' ? nextParam : '/admin'
  const statusMessage =
    typeof reasonParam === 'string' ? (STATUS_MESSAGE[reasonParam] ?? null) : null

  return <AdminLoginForm nextPath={nextPath} statusMessage={statusMessage} />
}
