import { execa } from 'execa';
import { resolve } from 'path';

// Set a long timeout for these E2E tests
vi.setConfig({ testTimeout: 120000 }); // 2 minutes

const SCRIPT_PATH = resolve(__dirname, '../../../scripts');

describe('E2E Tests for Scripts', () => {
  it('should run the clear-database script successfully', async () => {
    const { stdout, exitCode } = await execa('tsx', [resolve(SCRIPT_PATH, 'db/clear-database.ts')]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('All tables cleared successfully!');
  });

  it('should run the generate-market-research script successfully', async () => {
    const { stdout, exitCode } = await execa('tsx', [resolve(SCRIPT_PATH, 'generate-market-research.ts')]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Market research successful');
  });

  it('should run the generate-batch-predictions script successfully', async () => {
    const { stdout, exitCode } = await execa('tsx', [resolve(SCRIPT_PATH, 'generate-batch-predictions.ts')]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Batch prediction generation completed successfully!');
  });
});
