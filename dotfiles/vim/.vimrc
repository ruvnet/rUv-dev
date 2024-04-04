" rUv AI Development System - Optimized Vim Configuration

" General settings
set nocompatible
set encoding=utf-8
set number
set relativenumber
set autoindent
set smartindent
set tabstop=4
set shiftwidth=4
set expandtab
set hlsearch
set incsearch
set ignorecase
set smartcase
set wildmenu
set wildmode=list:longest
set cursorline
set laststatus=2
set updatetime=300
set shortmess+=c
set clipboard=unnamedplus

" Key mappings
let mapleader = ","
nnoremap <leader>kb :e ~/kb/
nnoremap <leader>jn :terminal jupyter notebook<CR>
nnoremap <leader>oi :terminal interpreter<CR>
nnoremap <leader>oic :terminal interpreter --config<CR>
nnoremap <leader>oip :read !interpreter 
nnoremap <leader>oie :w !interpreter > 
nnoremap <leader>cit :terminal bash ~/ci-cd/run-tests.sh<CR>

" Plugins
call plug#begin('~/.vim/plugged')

" Open Interpreter integration
Plug 'dense-analysis/ale'
Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
Plug 'zchee/deoplete-jedi'
Plug 'davidhalter/jedi-vim'

" Jupyter Notebook integration
Plug 'jupyter-vim/jupyter-vim'

" AI-powered code completion and assistance
Plug 'github/copilot.vim'
Plug 'codota/tabnine-vim'

" Git integration
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'

" File navigation and search
Plug 'scrooloose/nerdtree'
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'

" Other useful plugins
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'tpope/vim-surround'
Plug 'tpope/vim-commentary'
Plug 'jiangmiao/auto-pairs'

call plug#end()

" Plugin configurations
let g:deoplete#enable_at_startup = 1
let g:jedi#completions_enabled = 0
let g:jedi#use_splits_not_buffers = "right"
let g:jupyter_mapkeys = 0
let g:copilot_no_tab_map = v:true
let g:copilot_assume_mapped = v:true
let g:copilot_tab_fallback = ""
let g:NERDTreeShowHidden = 1
let g:NERDTreeIgnore = ['^\.DS_Store$', '^tags$', '\.git$[[dir]]', '\.idea$[[dir]]', '\.sass-cache$']

" Local knowledge base
set path+=~/kb

" Color scheme
colorscheme default

" Custom status line
set statusline=%f\ %h%w%m%r\ %=%(%l,%c%V\ %=\ %P%)

" Automatically install missing plugins on startup
autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif
