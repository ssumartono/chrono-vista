export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startIssueScheduler } = await import('./lib/issue-scheduler');
    startIssueScheduler();
  }
}
