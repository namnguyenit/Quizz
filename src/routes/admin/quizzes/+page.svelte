<script lang="ts">
	import type { PageData } from './$types';
	import { BarChart, LogOut, FileText, Users, Eye, Search, ArrowLeft } from '@lucide/svelte';

	let { data } = $props<{ data: PageData }>();
    
    let searchQuery = $state('');

	function formatQuizPath(path: string): string {
		if (!path) return 'Đang ở trang chủ';
		const parts = path.split('/');
		const file = parts.pop()?.replace('.json', '') || '';
		const formatName = (str: string) => str.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
		
		let result = formatName(file);
		if (parts.length > 0 && parts[0] === 'subjects') {
			parts.shift(); // bỏ 'subjects'
			if (parts.length > 0) {
				result = formatName(parts[parts.length - 1]) + ' - ' + result;
			}
		}
		return result;
	}

    const displayedStats = $derived.by(() => {
        if (!searchQuery.trim()) return data.stats;
        return data.stats.filter((s:any) => s.quiz_path.toLowerCase().includes(searchQuery.toLowerCase()) || formatQuizPath(s.quiz_path).toLowerCase().includes(searchQuery.toLowerCase()));
    });

</script>

<svelte:head>
	<title>Quiz Analytics - Admin Dashboard</title>
</svelte:head>

<div class="h-[100dvh] w-screen overflow-y-auto bg-gray-950 text-gray-200 p-4 md:p-8 font-sans relative z-10">
    <div class="max-w-5xl mx-auto space-y-6 pb-20">
        
        <!-- Header -->
        <header class="flex flex-col md:flex-row items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 shadow-xl">
            <div class="flex items-center gap-3">
                <div class="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
                    <BarChart class="text-indigo-400" size={24} />
                </div>
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-white tracking-tight">Quiz Content Analytics</h1>
                    <p class="text-gray-400 text-sm">Thống kê số lượt làm đề</p>
                </div>
            </div>
            <div class="flex items-center gap-3 mt-4 md:mt-0">
                <a href="/admin" class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition-colors">
                    <ArrowLeft size={16} /> Về Traffic
                </a>
            </div>
        </header>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                <div class="bg-emerald-500/20 p-3 rounded-full text-emerald-400"><FileText size={24} /></div>
                <div>
                    <p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tổng Đề Thi Được Làm</p>
                    <h3 class="text-2xl font-bold text-white mt-0.5">{data.stats.length}</h3>
                </div>
            </div>
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                <div class="bg-blue-500/20 p-3 rounded-full text-blue-400"><Eye size={24} /></div>
                <div>
                    <p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tổng Lượt Mở Đề</p>
                    <h3 class="text-2xl font-bold text-white mt-0.5">{data.stats.reduce((acc: number, curr: any) => acc + curr.total_views, 0)}</h3>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div class="p-4 md:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 class="text-white font-semibold flex items-center gap-2"><BarChart size={18} class="text-indigo-400" /> Thống kê chi tiết</h3>
                <div class="relative w-full sm:w-64 max-w-sm">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Tìm môn / đề..." 
                        bind:value={searchQuery}
                        class="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                </div>
            </div>
            <div class="overflow-x-auto w-full">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-gray-950/50 text-gray-400 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th class="px-6 py-3 font-semibold w-12">#</th>
                            <th class="px-6 py-3 font-semibold">Tên Đề Thi</th>
                            <th class="px-6 py-3 font-semibold text-right">Lượt Mở (Views)</th>
                            <th class="px-6 py-3 font-semibold text-right">Người dùng (Unique)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/60 text-gray-300">
                        {#each displayedStats as row, i}
                            <tr class="hover:bg-gray-800/40 transition-colors">
                                <td class="px-6 py-3.5 text-gray-500">{i + 1}</td>
                                <td class="px-6 py-3.5">
                                    <div class="font-semibold text-white whitespace-normal line-clamp-2 md:whitespace-nowrap md:line-clamp-none">{formatQuizPath(row.quiz_path)}</div>
                                    <div class="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-sm" title={row.quiz_path}>{row.quiz_path}</div>
                                </td>
                                <td class="px-6 py-3.5 text-right font-bold text-emerald-400">{row.total_views}</td>
                                <td class="px-6 py-3.5 text-right text-blue-300">{row.unique_users}</td>
                            </tr>
                        {/each}
                        {#if displayedStats.length === 0}
                            <tr>
                                <td colspan="4" class="px-6 py-12 text-center text-gray-500 italic">
                                    Không có dữ liệu đề thi nào.
                                </td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
