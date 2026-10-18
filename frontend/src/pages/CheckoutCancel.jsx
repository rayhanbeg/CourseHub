import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    let courseId = '';
    try {
      courseId = sessionStorage.getItem('coursehub_checkout_course') || '';
      if (courseId) sessionStorage.removeItem('coursehub_checkout_course');
    } catch { /* Session storage is optional. */ }
    if (courseId) {
      setReturning(true);
      navigate(`/checkout/${encodeURIComponent(courseId)}?cancelled=1`, { replace: true });
    }
  }, [navigate]);
  if (returning) return <main className="public-container checkout-page" aria-live="polite">Returning to checkout…</main>;
  return <main className="min-h-[65vh] px-4 py-16"><section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center sm:p-12"><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Checkout canceled</p><h1 className="mb-3 text-3xl font-semibold text-dark">No payment was taken</h1><p className="mb-8 text-gray-600">Your order remains pending until you complete payment. You can return to the course to try again.</p><div className="flex justify-center gap-3"><Link className="rounded-lg bg-primary px-5 py-3 font-semibold text-white" to="/courses">Browse courses</Link>{params.get('orderId') && <Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" to="/dashboard/orders">Order history</Link>}</div></section></main>;
}
