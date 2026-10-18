import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { CheckCircle2, Clock3 } from 'lucide-react';

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) { setError('We could not find this order. Check your order history for updates.'); return undefined; }
    let active = true;
    let attempts = 0;
    let timer;
    const checkOrder = async () => {
      try {
        const { data } = await orderAPI.getOrderById(orderId);
        if (!active) return;
        setOrder(data.order);
        if (data.order.status === 'pending' && attempts++ < 9) timer = window.setTimeout(checkOrder, 2000);
      } catch (err) { if (active) setError(err.response?.data?.message || 'Unable to check this order right now.'); }
    };
    checkOrder();
    return () => { active = false; window.clearTimeout(timer); };
  }, [orderId]);

  const completed = order?.status === 'completed';
  return <main className="min-h-[65vh] px-4 py-16"><section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center sm:p-12">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">{completed ? <CheckCircle2 className="h-7 w-7 text-primary" /> : <Clock3 className="h-7 w-7 text-primary" />}</div>
    <h1 className="mb-3 text-3xl font-semibold text-dark">{completed ? 'You’re enrolled' : order?.status === 'failed' ? 'Payment needs attention' : 'Confirming your payment'}</h1>
    <p className="mx-auto mb-8 max-w-lg text-gray-600">{completed ? 'Your payment is confirmed and course access is ready.' : order?.status === 'failed' ? 'Stripe could not complete this payment. You can return to the course and try again.' : 'Stripe is processing your payment. Course access appears here after our server receives confirmation.'}</p>
    {error && <p role="alert" className="mb-6 text-sm text-red-700">{error}</p>}
    {order && <div className="mb-8 rounded-lg border border-slate-200 p-5 text-left text-sm"><div className="flex justify-between gap-4"><span>Course</span><strong>{order.course?.title || 'Course'}</strong></div><div className="mt-3 flex justify-between gap-4"><span>Order</span><strong className="font-mono">{order._id}</strong></div><div className="mt-3 flex justify-between gap-4"><span>Total</span><strong>{order.currency} {Number(order.amount).toFixed(2)}</strong></div><div className="mt-3 flex justify-between gap-4"><span>Status</span><strong className="capitalize">{order.status}</strong></div></div>}
    <div className="flex flex-col justify-center gap-3 sm:flex-row"><Link className="rounded-lg bg-primary px-5 py-3 font-semibold text-white" to={completed && order?.course?._id ? `/course/${order.course._id}` : '/dashboard/orders'}>{completed ? 'Start learning' : 'View order history'}</Link><Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" to="/courses">Browse courses</Link></div>
  </section></main>;
};

export default CheckoutSuccess;
