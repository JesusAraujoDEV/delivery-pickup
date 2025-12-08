import reportsService from '../services/reports.service.js';

async function exportReport(req, res, next) {
  try {
    const { stream, filename } = await reportsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export default { exportReport };
