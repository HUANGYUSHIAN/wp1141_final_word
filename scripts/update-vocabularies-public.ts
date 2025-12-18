import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("開始更新所有單字本為 public=true...");

  try {
    // 更新所有單字本，將 public 設為 true
    const result = await prisma.vocabulary.updateMany({
      where: {},
      data: {
        public: true,
      },
    });

    console.log(`成功更新 ${result.count} 個單字本為 public=true`);
  } catch (error) {
    console.error("更新失敗:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

