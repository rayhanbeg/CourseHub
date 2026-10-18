import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download } from 'lucide-react';
import { orderAPI } from '../services/api';
import './studentPages.css';
import { m, motionTokens, Pressable, useReducedMotion } from '../lib/motion';

const formatCurrency = (amount, code = 'USD') => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(Number(amount || 0)); }
  catch { return `${Number(amount || 0).toFixed(2)} ${code}`; }
};
const receiptNumber = (order) => `CH-${new Date(order.createdAt).getFullYear()}-${order._id.slice(-8).toUpperCase()}`;
const statusInfo = (status) => ({ completed: ['Paid', 'paid'], pending: ['Pending', 'pending'], failed: ['Failed', 'failed'], refunded: ['Refunded', 'refunded'] }[status] || [status?.[0]?.toUpperCase() + status?.slice(1), 'refunded']);

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [downloadedId, setDownloadedId] = useState('');
  const reduced = useReducedMotion();

  useEffect(() => {
    let active = true;
    orderAPI.getUserOrders().then(({ data }) => { if (active) setOrders(data.orders || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load order history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const downloadReceipt = async (order) => {
    const number = receiptNumber(order);
    setDownloadError(''); setDownloadedId(''); setDownloadingId(order._id);
    try {
      const { data } = await orderAPI.downloadReceipt(order._id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `CourseHub-Receipt-${number}.pdf`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadedId(order._id);
    } catch (err) { setDownloadError(err.response?.data?.message || 'Receipt could not be downloaded. Please try again.'); }
    finally { setDownloadingId(''); }
  };

  return <main className="orders-page public-container">
    <header className="orders-page__header"><p className="eyebrow">Your account</p><h1>Orders &amp; receipts</h1><p>Payment records and downloadable receipts for your courses.</p></header>
    {downloadError && <p className="receipt-error" role="alert">{downloadError}</p>}
    {loading ? <div className="orders-skeleton" aria-label="Loading orders">{[0, 1, 2, 3].map((item) => <i key={item} />)}</div>
      : error ? <p className="student-error" role="alert">{error}</p>
        : !orders.length ? <section className="orders-list orders-empty"><h2>No orders yet</h2><p>Your course purchases and receipts will appear here.</p><Link className="student-text-link" to="/courses">Explore courses</Link></section>
          : <section className="orders-list" aria-label="Order history">
            <div className="orders-list__head"><span>Date</span><span>Course</span><span style={{ textAlign: 'right' }}>Amount</span><span>Status</span><span>Receipt</span></div>
            {orders.map((order) => {
              const [statusLabel, statusClass] = statusInfo(order.status);
              return <m.article className="order-row" key={order._id} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base, delay: reduced || orders.indexOf(order) >= 8 ? 0 : orders.indexOf(order) * motionTokens.stagger }}>
                <time className="order-row__date" dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}<span className="order-row__receipt">{receiptNumber(order)}</span></time>
                <h2 className="order-row__title">{order.courseTitle || order.course?.title || 'Course no longer available'}</h2>
                <span className="order-row__amount">{formatCurrency(order.amount, order.currency)}</span>
                <span className="order-row__status"><span className={`order-status order-status--${statusClass}`}>{statusLabel}</span></span>
                <span className="order-row__download">{['completed', 'refunded'].includes(order.status) ? <Pressable className="receipt-button" type="button" disabled={downloadingId === order._id} onClick={() => downloadReceipt(order)}>{downloadedId === order._id ? <m.span initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }}><Check size={14} /></m.span> : <Download size={14} />}{downloadingId === order._id ? 'Preparing…' : downloadedId === order._id ? 'Downloaded' : 'Download receipt'}</Pressable> : <span className="order-row__date">Available when paid</span>}</span>
              </m.article>;
            })}
          </section>}
  </main>;
}
