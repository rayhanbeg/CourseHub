const cookieOptions = (path = '/') => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('coursehub_access', accessToken, {
    ...cookieOptions('/'),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('coursehub_refresh', refreshToken, {
    ...cookieOptions('/api/auth'),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('coursehub_access', cookieOptions('/'));
  res.clearCookie('coursehub_refresh', cookieOptions('/api/auth'));
};

const readCookie = (req, name) => {
  const cookieHeader = req.headers.cookie || '';
  const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

export { setAuthCookies, clearAuthCookies, readCookie };
