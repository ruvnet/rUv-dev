#!/bin/bash

echo "
                                
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/    
                    
"

echo "🤖 rUv - Your Intelligent Agent for Creation"
echo "🌐 Global Domination Initiated..."

echo "🚀 Cloning rUv-dev repository..."
git clone --bare https://github.com/ruvnet/rUv-dev.git $HOME/.rUv-dev
echo "✅ rUv-dev repository cloned successfully!"

echo "🔧 Defining rUv-dev alias..."
alias ruvdev='git --git-dir=$HOME/.rUv-dev/ --work-tree=$HOME'
echo "✅ rUv-dev alias defined!"

echo "🔄 Checking out rUv-dev files to home directory..."
mkdir -p $HOME/.rUv-dev-backup
ruvdev checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} $HOME/.rUv-dev-backup/{}
ruvdev checkout
echo "✅ rUv-dev files checked out successfully!"

echo "👀 Setting flag to hide untracked files..."
ruvdev config --local status.showUntrackedFiles no
echo "✅ Flag set to hide untracked files!"

echo "🔌 Applying rUv-dev configurations..."

echo "📂 Creating necessary directories..."
mkdir -p $HOME/dotfiles/aliases
mkdir -p $HOME/dotfiles/bash
mkdir -p $HOME/dotfiles/git
mkdir -p $HOME/dotfiles/secrets
mkdir -p $HOME/dotfiles/tmux
mkdir -p $HOME/dotfiles/vim
mkdir -p $HOME/dotfiles/zsh
echo "✅ Directories created successfully!"

echo "🔗 Symlinking dotfiles..."
ln -sf $HOME/.rUv-dev/dotfiles/aliases/.aliases $HOME/dotfiles/aliases/.aliases
ln -sf $HOME/.rUv-dev/dotfiles/aliases/.aliases_work $HOME/dotfiles/aliases/.aliases_work
ln -sf $HOME/.rUv-dev/dotfiles/bash/.bashrc $HOME/dotfiles/bash/.bashrc
ln -sf $HOME/.rUv-dev/dotfiles/bash/.bash_profile $HOME/dotfiles/bash/.bash_profile
ln -sf $HOME/.rUv-dev/dotfiles/git/.gitconfig $HOME/dotfiles/git/.gitconfig
ln -sf $HOME/.rUv-dev/dotfiles/secrets/.secrets $HOME/dotfiles/secrets/.secrets
ln -sf $HOME/.rUv-dev/dotfiles/secrets/.secrets_work $HOME/dotfiles/secrets/.secrets_work
ln -sf $HOME/.rUv-dev/dotfiles/tmux/.tmux.conf $HOME/dotfiles/tmux/.tmux.conf
ln -sf $HOME/.rUv-dev/dotfiles/vim/.vimrc $HOME/dotfiles/vim/.vimrc
ln -sf $HOME/.rUv-dev/dotfiles/zsh/.zshrc $HOME/dotfiles/zsh/.zshrc
echo "✅ Dotfiles symlinked successfully!"

echo "🐚 Sourcing shell files..."
if [ -f $HOME/dotfiles/bash/.bashrc ]; then
  source $HOME/dotfiles/bash/.bashrc
fi
if [ -f $HOME/dotfiles/zsh/.zshrc ]; then
  source $HOME/dotfiles/zsh/.zshrc
fi
echo "✅ Shell files sourced successfully!"

echo "🎉 rUv-dev bootstrap completed successfully!"
echo "🤖 rUv is ready to assist you in creating anything!"
echo "💪 Let's embark on a journey of innovation and creativity!"
