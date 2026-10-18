import Course from '../models/Course.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';

const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const periodStart = (range, now) => {
  const start = dayStart(now);
  if (range === '7d') start.setDate(start.getDate() - 6);
  else if (range === '90d') start.setDate(start.getDate() - 89);
  else if (range === '12m') { start.setMonth(start.getMonth() - 11); start.setDate(1); }
  else start.setDate(start.getDate() - 29);
  return start;
};
const bucketKey = (date, monthly) => {
  const d = new Date(date);
  return monthly ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const changePercent = (current, previous) => previous ? Math.round(((current - previous) / previous) * 100) : current ? 100 : 0;

export const getDashboardData = async (req, res, next) => {
  try {
    const now = new Date();
    const range = ['7d', '30d', '90d', '12m'].includes(req.query.range) ? req.query.range : '30d';
    const monthly = range === '12m';
    const start = periodStart(range, now);
    const span = now.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - span - 86400000);
    const [courses, orders, students, progress] = await Promise.all([
      Course.find().select('title price isPublished enrollmentCount createdAt').sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentRecord' } },
        { $unwind: { path: '$studentRecord', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseRecord' } },
        { $unwind: { path: '$courseRecord', preserveNullAndEmptyArrays: true } },
        { $addFields: {
          student: { _id: '$studentRecord._id', name: '$studentRecord.name', email: '$studentRecord.email' },
          course: { _id: '$courseRecord._id', title: '$courseRecord.title', price: '$courseRecord.price' },
          courseTitle: {
            $cond: [
              { $ne: [{ $ifNull: ['$courseTitle', ''] }, ''] },
              '$courseTitle',
              '$courseRecord.title',
            ],
          },
        } },
        { $sort: { createdAt: -1 } },
        { $project: { studentRecord: 0, courseRecord: 0 } },
      ]),
      User.find({ role: 'student' }).select('name email enrolledCourses createdAt').sort({ createdAt: -1 }).lean(),
      Progress.find().select('student course overallProgress').lean(),
    ]);
    const currentOrders = orders.filter((o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= now);
    const previousOrders = orders.filter((o) => new Date(o.createdAt) >= previousStart && new Date(o.createdAt) < start);
    const revenueOf = (list) => list.filter((o) => o.status === 'completed').reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const countBy = (list, predicate) => list.filter(predicate).length;
    const currentStudents = countBy(students, (s) => new Date(s.createdAt) >= start);
    const previousStudents = countBy(students, (s) => new Date(s.createdAt) >= previousStart && new Date(s.createdAt) < start);
    const currentCourses = countBy(courses, (c) => new Date(c.createdAt) >= start);
    const previousCourses = countBy(courses, (c) => new Date(c.createdAt) >= previousStart && new Date(c.createdAt) < start);
    const metrics = {
      revenue: { value: revenueOf(currentOrders), change: changePercent(revenueOf(currentOrders), revenueOf(previousOrders)) },
      orders: { value: currentOrders.length, change: changePercent(currentOrders.length, previousOrders.length) },
      students: { value: students.length, change: changePercent(currentStudents, previousStudents) },
      courses: { value: courses.length, change: changePercent(currentCourses, previousCourses) },
    };

    const chart = [];
    if (monthly) {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cursor <= end) {
        const key = bucketKey(cursor, true);
        chart.push({ key, label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const cursor = new Date(start);
      while (cursor <= now) {
        const key = bucketKey(cursor, false);
        chart.push({ key, label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    const chartMap = new Map(chart.map((item) => [item.key, item]));
    orders.forEach((order) => {
      if (order.status !== 'completed' || new Date(order.createdAt) < start || new Date(order.createdAt) > now) return;
      const item = chartMap.get(bucketKey(order.createdAt, monthly));
      if (item) item.revenue += Number(order.amount || 0);
    });

    const periodOrders = currentOrders;
    const statusCounts = ['completed', 'pending', 'failed', 'refunded'].map((status) => ({
      name: status, value: currentOrders.filter((order) => order.status === status).length,
    }));
    const revenueByCourse = new Map();
    orders.filter((order) => order.status === 'completed' && order.course?._id).forEach((order) => {
      const id = order.course._id.toString();
      revenueByCourse.set(id, (revenueByCourse.get(id) || 0) + Number(order.amount || 0));
    });
    const courseRows = courses.map((course) => ({ ...course, revenue: revenueByCourse.get(course._id.toString()) || 0 }));
    const progressByStudent = new Map();
    progress.forEach((item) => {
      const key = item.student.toString();
      const row = progressByStudent.get(key) || { total: 0, count: 0 };
      row.total += Number(item.overallProgress || 0); row.count += 1;
      progressByStudent.set(key, row);
    });
    const studentRows = students.map((student) => {
      const p = progressByStudent.get(student._id.toString());
      return { _id: student._id, name: student.name, email: student.email, joinedAt: student.createdAt, enrolledCourses: student.enrolledCourses?.length || 0, averageProgress: p?.count ? Math.round(p.total / p.count) : 0 };
    });
    res.json({ success: true, range, metrics, chart, statusCounts, periodOrders, courses: courseRows, orders, students: studentRows });
  } catch (error) { next(error); }
};
