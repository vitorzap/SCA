#!/bin/zsh

# Verifica se o diretório _dev_util existe, caso não exista, cria
if [ ! -d "_dev_util" ]; then
    mkdir _dev_util
fi

# Verifica se o diretório mig_aux existe dentro de _dev_util, caso não exista, cria
if [ ! -d "_dev_util/mig_aux" ]; then
    mkdir _dev_util/mig_aux
fi

# Encontra o próximo número de versão para o arquivo modelSnapshot
next_version=0
while [ -f "_dev_util/mig_aux/modelSnapshot_v$(printf "%03d" $next_version).js" ]; do
    ((next_version++))
done

# Cria o novo arquivo modelSnapshot com o conteúdo dos arquivos .js em ../models
output_file="_dev_util/mig_aux/modelSnapshot_v$(printf "%03d" $next_version).js"
touch $output_file

for file in models/*.js; do
    echo "" >> $output_file
    echo "" >> $output_file
    echo "// Nome do arquivo: $file" >> $output_file
    cat $file >> $output_file
done

echo "Arquivo criado: $output_file"
