#!/usr/bin/env node

import { execSync } from 'child_process';
import { Command } from 'commander';
import { input, select} from "@inquirer/prompts";
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

const askPackageManager = async (): Promise<string> => {
    const value = await select({
        message: "Choose a package manager",
        choices: [
            {
                name: "npm",
                value: "npm",
            },
            {
                name: "yarn",
                value: "yarn",
            },
            {
                name: "pnpm",
                value: "pnpm",
            },
        ],
    });

    return value;
};

const askProjectName = async (): Promise<string> => {
    const value = await input({
        message: "Enter the project name",
    });

    if(!value) {
        console.error("Error: Project name is required.");
        process.exit(1);
    }

    return value;
};

program
    .version('1.0.0')
    .description('Create a Vite app with Tailwind CSS and shadcn/ui')
    .option('-p, --package-manager', 'Choose the package manager (npm, pnpm, yarn)')
    .option('-n, --project-name', 'Specify the project name')
    .action(async (options: { packageManager?: string, projectName?: string }) => {
        let packageManager = options.packageManager;
        if (!packageManager) {
            packageManager = await askPackageManager();
        }

        let projectName = options.projectName;
        if (!projectName) {
            projectName = await askProjectName();
        }

        // パッケージマネージャーが正しいかどうかをチェック
        if (!['npm', 'pnpm', 'yarn'].includes(packageManager)) {
            console.error('Error: Unsupported package manager. Please choose npm, pnpm, or yarn.');
            process.exit(1);
        }

        // Vite アプリの作成
        console.log(`Creating Vite app: ${projectName} using ${packageManager}`);
        execSync(`${packageManager === 'npm' ? 'npm create vite@latest' : `${packageManager} create vite`} ${projectName}`, { stdio: 'inherit' });

        // プロジェクトディレクトリに移動
        process.chdir(projectName);

        // Tailwind CSS と shadcn/ui のインストールコマンド
        const installCommand: { [key: string]: string } = {
            npm: 'npm install -D tailwindcss postcss autoprefixer && npm install @shadcn/ui',
            pnpm: 'pnpm add -D tailwindcss postcss autoprefixer && pnpm add @shadcn/ui',
            yarn: 'yarn add -D tailwindcss postcss autoprefixer && yarn add @shadcn/ui',
        };

        const initTailwindCommand: { [key: string]: string } = {
            npm: 'npx tailwindcss init -p',
            pnpm: 'pnpx tailwindcss init -p',
            yarn: 'yarn tailwindcss init -p',
        };

        // Tailwind CSS と shadcn/ui のインストール
        console.log(`Installing dependencies with ${packageManager}: Tailwind CSS, shadcn/ui`);
        execSync(installCommand[packageManager], { stdio: 'inherit' });

        // Tailwind CSS の初期設定
        execSync(initTailwindCommand[packageManager], { stdio: 'inherit' });

        // Tailwind CSS の設定ファイルを作成
        const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
        const tailwindConfig = `
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
        fs.writeFileSync(tailwindConfigPath, tailwindConfig);

        // Tailwind CSS のグローバルスタイルを設定
        const tailwindStylesPath = path.join(process.cwd(), 'src', 'index.css');
        const tailwindStyles = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;
        fs.writeFileSync(tailwindStylesPath, tailwindStyles);

        console.log(`Vite app with Tailwind CSS and shadcn/ui setup is complete using ${packageManager}!`);
    });

program.parse(process.argv);
