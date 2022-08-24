export const cookieParser = (request: Request) => {
	const cookie = request.headers.get('cookie') ?? '';
  const cookieMap = cookie
		?.split(';')
		.map((v) => v.split('='))
		.reduce(
			(acc, v) => ({
				...acc,
				[decodeURIComponent(v[0].trim())]: decodeURIComponent((v[1] ?? '').trim())
			}),
			{} as Record<string, string>
		);

  return (key: string) => key in cookieMap ? cookieMap[key] : '';
};